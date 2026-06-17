"""
servicios/servicio_etl.py
=========================
Servicio ETL v3 — modelo controlado persistente.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime
from typing import AsyncGenerator
import re

from fastapi import HTTPException

import repositorios.repo_corridas as r_corrida
import repositorios.repo_comandos as r_cmd
import repositorios.repo_locks as r_lock
from nucleo.etl_catalogo import listar_facts_disponibles
from nucleo.etl_argumentos import enriquecer_corrida_con_parametros, serializar_comentario_etl
from nucleo.excepciones import ErrorValidacion
from nucleo.logging import obtener_logger
from nucleo.conexion import obtener_engine
from sqlalchemy import text

log = obtener_logger(__name__)

_POLL_INTERVALO_SEG     = 2.0   # Frecuencia de polling SSE al DB
_POLL_TIMEOUT_TOTAL_SEG = 7200  # 2 horas máximo de streaming SSE por corrida


async def iniciar_corrida(
    iniciado_por: str,
    comentario: str | None = None,
    modo_ejecucion: str = "completo",
    facts: list[str] | None = None,
    incluir_dependencias: bool = True,
    refrescar_gold: bool = True,
    forzar_relectura_bronce: bool = True,
    max_reintentos: int = 0,
    timeout_segundos: int = 3600,
) -> dict:
    """
    Registra la corrida en Control.* y la pone en la cola del runner.
    """
    # M7 — Validar que no haya una corrida activa antes de insertar.
    # Solo bloqueamos si el lock está ACTIVO (heartbeat reciente).
    # Un lock VENCIDO (heartbeat > 120s) significa que el runner murió y
    # la próxima corrida podrá robar el lock legítimamente.
    try:
        lock_info = await asyncio.to_thread(r_lock.obtener_estado_lock)
        if lock_info.get("estado_lock") == "ACTIVO":
            raise HTTPException(
                status_code=409,
                detail="Ya hay una corrida activa. Espera a que termine antes de lanzar otra.",
            )
    except HTTPException:
        raise
    except Exception:
        log.warning(
            "[ETL] No se pudo verificar estado del lock antes de iniciar — se continúa con precaución",
            exc_info=True,
        )

    id_corrida = str(uuid.uuid4())
    ahora      = datetime.now()
    try:
        comentario_persistido = serializar_comentario_etl(
            comentario_usuario=comentario,
            modo_ejecucion=modo_ejecucion,
            facts=facts,
            incluir_dependencias=incluir_dependencias,
            refrescar_gold=refrescar_gold,
            forzar_relectura_bronce=forzar_relectura_bronce,
        )
    except ValueError as error:
        raise ErrorValidacion(str(error)) from error

    # 1. Crear registro maestro
    await asyncio.to_thread(
        r_corrida.insertar_corrida,
        id_corrida     = id_corrida,
        iniciado_por   = iniciado_por,
        comentario     = comentario_persistido,
        max_reintentos = max_reintentos,
        timeout_segundos = timeout_segundos,
    )

    # 2. Encolar comando para el runner
    try:
        await asyncio.to_thread(
            r_cmd.encolar_comando,
            id_corrida     = id_corrida,
            iniciado_por   = iniciado_por,
            tipo_comando   = "INICIAR",
            comentario     = comentario_persistido,
            max_reintentos = max_reintentos,
            timeout_seg    = timeout_segundos,
        )
    except Exception as exc:
        # Transacción compensatoria: marcar la corrida como ERROR para que no quede huérfana
        log.error(
            "[ETL] Fallo al encolar comando — marcando corrida como ERROR para evitar huérfana",
            extra={"id_corrida": id_corrida},
            exc_info=True,
        )
        try:
            await asyncio.to_thread(
                r_corrida.actualizar_estado_corrida,
                id_corrida=id_corrida,
                estado="ERROR",
                mensaje_final="Fallo al encolar en cola del runner. La corrida no fue procesada.",
            )
        except Exception:
            pass
        raise HTTPException(
            status_code=503,
            detail="No se pudo encolar la corrida en el runner. Intenta de nuevo en unos segundos.",
        ) from exc

    log.info(
        "Corrida encolada",
        extra={"id_corrida": id_corrida, "iniciado_por": iniciado_por},
    )

    return {
        "id_corrida":   id_corrida,
        "id_log":       None,
        "iniciado_por": iniciado_por,
        "fecha_inicio": ahora,
        "estado":       "PENDIENTE",
    }


async def cancelar_corrida(id_corrida: str, solicitado_por: str) -> bool:
    """Solicita la cancelación de una corrida activa."""
    resultado = await asyncio.to_thread(
        r_corrida.solicitar_cancelacion,
        id_corrida, solicitado_por
    )
    if resultado:
        await asyncio.to_thread(
            r_corrida.insertar_evento,
            id_corrida,
            f"[CANCELADO] Solicitado por {solicitado_por}",
            "FIN",
        )
    return resultado


async def stream_eventos_corrida(id_corrida: str) -> AsyncGenerator[dict, None]:
    """Generador asíncrono para EventSourceResponse con polling persistente."""
    ultimo_id_visto = 0
    elapsed_sec    = 0.0
    estados_terminal = {"OK", "ERROR", "CANCELADO", "TIMEOUT"}

    try:
        while elapsed_sec < _POLL_TIMEOUT_TOTAL_SEG:
            eventos, estado_corrida = await asyncio.to_thread(
                r_corrida.listar_eventos_y_estado,
                id_corrida,
                ultimo_id_visto,
            )

            for evento in eventos:
                ultimo_id_visto = evento["id_evento"]
                yield {
                    "event": evento["tipo"].lower(),
                    "data":  evento["mensaje"],
                    "id":    str(evento["id_evento"]),
                }

            if estado_corrida in estados_terminal:
                eventos_finales, _ = await asyncio.to_thread(
                    r_corrida.listar_eventos_y_estado, id_corrida, ultimo_id_visto
                )
                for evento in eventos_finales:
                    yield {
                        "event": evento["tipo"].lower(),
                        "data":  evento["mensaje"],
                        "id":    str(evento["id_evento"]),
                    }
                yield {"event": "fin", "data": "[FIN_CORRIDA]"}
                return

            await asyncio.sleep(_POLL_INTERVALO_SEG)
            elapsed_sec += _POLL_INTERVALO_SEG

        yield {"event": "error", "data": "[TIMEOUT_STREAM] La corrida excedió el tiempo de streaming."}

    except asyncio.CancelledError:
        log.debug("[SSE] Cliente desconectado — stream cancelado", extra={"id_corrida": id_corrida})
        return


async def corrida_existe(id_corrida: str) -> bool:
    """Verificación rápida de existencia asíncrona."""
    res = await asyncio.to_thread(r_corrida.obtener_corrida, id_corrida)
    return res is not None


async def obtener_corrida(id_corrida: str) -> dict | None:
    """Retorna el estado detallado de una corrida."""
    raw = await asyncio.to_thread(r_corrida.obtener_corrida, id_corrida)
    if raw is None:
        return None
    corrida = enriquecer_corrida_con_parametros(raw)
    pasos = await asyncio.to_thread(r_corrida.listar_pasos_corrida, id_corrida)
    corrida["pasos"] = pasos
    return corrida


async def obtener_pasos_corrida(id_corrida: str) -> list[dict]:
    """Retorna la traza de pasos de forma asíncrona."""
    return await asyncio.to_thread(r_corrida.listar_pasos_corrida, id_corrida)


def _serializar_dt(v: object) -> str | None:
    """Convierte datetime a ISO-8601 string; retorna None si es None."""
    if v is None:
        return None
    if hasattr(v, "isoformat"):
        return v.isoformat()  # type: ignore[union-attr]
    return str(v)


def _normalizar_corrida_activa(c: dict) -> dict:
    """
    Normaliza el dict PascalCase que devuelve el repo (columnas SQL Server)
    al contrato snake_case que consume el portal vía FastApiCorridaActiva.
    """
    return {
        "id_corrida":             c.get("ID_Corrida"),
        "iniciado_por":           c.get("Iniciado_Por"),
        "estado":                 c.get("Estado"),
        "intento_numero":         c.get("Intento_Numero", 1),
        "max_reintentos":         c.get("Max_Reintentos", 0),
        "fecha_solicitud":        _serializar_dt(c.get("Fecha_Solicitud")),
        "fecha_inicio":           _serializar_dt(c.get("Fecha_Inicio")),
        "fecha_fin":              _serializar_dt(c.get("Fecha_Fin")),
        "heartbeat_ultimo":       _serializar_dt(c.get("Heartbeat_Ultimo")),
        "mensaje_final":          c.get("Mensaje_Final"),
        # Campos añadidos por enriquecer_corrida_con_parametros (ya snake_case)
        "modo_ejecucion":         c.get("modo_ejecucion"),
        "facts":                  c.get("facts") or [],
        "incluir_dependencias":   c.get("incluir_dependencias", True),
        "refrescar_gold":         c.get("refrescar_gold", True),
        "forzar_relectura_bronce": c.get("forzar_relectura_bronce", True),
    }


async def listar_corridas_activas(limite: int = 50) -> list[dict]:
    """
    Lista corridas activas (PENDIENTE/EJECUTANDO) asíncronamente.

    El repo es sync (pyodbc), así que la llamada se delega a un thread
    para no bloquear el event loop de FastAPI. `limite` permite acotar
    el payload cuando se llama desde dashboards en vivo.

    Normaliza las claves PascalCase de SQL Server a snake_case para el portal.
    """
    raw_list = await asyncio.to_thread(
        r_corrida.listar_corridas,
        limite=limite,
        solo_activas=True,
    )
    return [
        _normalizar_corrida_activa(enriquecer_corrida_con_parametros(c) or {})
        for c in raw_list
    ]


async def listar_catalogo_facts() -> list[dict]:
    """Retorna el catálogo oficial asíncronamente."""
    # listar_facts_disponibles es memoria pura (lista estática), no requiere thread
    return listar_facts_disponibles()

async def obtener_vista_previa(tabla: str) -> dict:
    """Ejecuta un SELECT TOP 10 sobre la tabla especificada (solo letras, numeros, guiones bajos y puntos)."""
    if not re.match(r"^[A-Za-z0-9_.]+$", tabla):
        raise HTTPException(status_code=400, detail="Nombre de tabla invalido")
    
    def _query():
        with obtener_engine().connect() as conn:
            # Proteccion minima contra inyeccion
            result = conn.execute(text(f"SELECT TOP 10 * FROM {tabla}"))
            columns = list(result.keys())
            rows = [dict(r) for r in result.mappings()]
            return {"columns": columns, "rows": rows}
            
    try:
        return await asyncio.to_thread(_query)
    except Exception as e:
        log.error(f"Error al obtener vista previa de {tabla}: {e}")
        raise HTTPException(status_code=500, detail=f"Error al consultar la tabla: {str(e)}")
