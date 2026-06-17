"""
migrar_valores_raw_tasa.py
==========================
Desempaca Valores_Raw de Bronce.Tasa_Crecimiento_Brotes hacia las columnas
fisicas dedicadas: Planta_Brote_Raw, Cantidad_Raw, Tallo_Raw, Condicion_Raw.

Solo actualiza filas donde esas columnas estan NULL (no sobreescribe datos
ya migrados por el cargador nuevo).
"""
import re
import pyodbc

CONN_STR = 'DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;'


def parsear_valores_raw(texto: str) -> dict:
    if not texto:
        return {}
    resultado = {}
    for parte in re.split(r'\s*\|\s*', str(texto).strip()):
        if '=' not in parte:
            continue
        clave, valor = parte.split('=', 1)
        clave = clave.strip()
        valor = valor.strip()
        if clave:
            resultado[clave] = valor
    return resultado


def migrar():
    conn = pyodbc.connect(CONN_STR, autocommit=False)
    cursor = conn.cursor()

    print("Leyendo filas con columnas dedicadas vacias...")
    cursor.execute("""
        SELECT ID_Tasa_Crecimiento, Valores_Raw
        FROM Bronce.Tasa_Crecimiento_Brotes
        WHERE (Planta_Brote_Raw IS NULL OR Cantidad_Raw IS NULL OR Tallo_Raw IS NULL)
          AND Valores_Raw IS NOT NULL
    """)
    filas = cursor.fetchall()
    print(f"Filas a migrar: {len(filas)}")

    actualizados = 0
    omitidos = 0
    lote = []

    for id_tc, valores_raw in filas:
        d = parsear_valores_raw(valores_raw)
        planta_brote = d.get('Ensayo_Raw')
        cantidad = d.get('Medida_Raw')
        tallo = d.get('Tipo_Tallo_Raw')
        # Condicion_Raw no existe en Bronce; se guarda en Evaluacion_Raw
        condicion = d.get('Condicion_Raw')

        if not planta_brote and not cantidad and not tallo:
            omitidos += 1
            continue

        # (planta_brote, cantidad, tallo, evaluacion, id)
        lote.append((planta_brote, cantidad, tallo, condicion, id_tc))

        if len(lote) >= 5000:
            cursor.executemany("""
                UPDATE Bronce.Tasa_Crecimiento_Brotes
                SET Planta_Brote_Raw = COALESCE(Planta_Brote_Raw, ?),
                    Cantidad_Raw     = COALESCE(Cantidad_Raw, ?),
                    Tallo_Raw        = COALESCE(Tallo_Raw, ?),
                    Evaluacion_Raw   = COALESCE(Evaluacion_Raw, ?)
                WHERE ID_Tasa_Crecimiento = ?
            """, lote)
            actualizados += len(lote)
            conn.commit()
            print(f"  Actualizados: {actualizados}...")
            lote = []

    # Remanente
    if lote:
        cursor.executemany("""
            UPDATE Bronce.Tasa_Crecimiento_Brotes
            SET Planta_Brote_Raw = COALESCE(Planta_Brote_Raw, ?),
                Cantidad_Raw     = COALESCE(Cantidad_Raw, ?),
                Tallo_Raw        = COALESCE(Tallo_Raw, ?),
                Evaluacion_Raw   = COALESCE(Evaluacion_Raw, ?)
            WHERE ID_Tasa_Crecimiento = ?
        """, lote)
        actualizados += len(lote)
        conn.commit()

    conn.close()
    print(f"\nMigracion completada: {actualizados} filas actualizadas, {omitidos} omitidas (sin datos utiles en Valores_Raw).")


if __name__ == '__main__':
    migrar()
