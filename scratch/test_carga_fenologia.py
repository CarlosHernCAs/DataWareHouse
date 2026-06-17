import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ETL')))

from config.conexion import obtener_engine
from sqlalchemy import text
from silver.facts.fact_ciclos_fenologicos import ProcesadorCiclosFenologicos
from mdm.homologador import homologar_columna
from utils.texto import titulo

def test_carga():
    engine = obtener_engine()
    proc = ProcesadorCiclosFenologicos(engine)
    
    cols_raw = [
        'Fecha_Raw', 'Modulo_Raw', 'Turno_Raw', 'Valvula_Raw',
        'Variedad_Raw', 'Evaluador_Raw',
        'Color_Raw', 'Organo_Raw',
        'Etapa_Fenologica_Raw',
        'Valores_Raw',
        'Fecha_Sistema',
    ]
    
    df = proc.leer_bronce(cols_raw)
    print(f"1. Filas leídas de Bronce (Estado_Carga = 'CARGADO'): {len(df)}")
    if df.empty:
        return
        
    with engine.connect() as conexion:
        df, cuar_var = homologar_columna(
            df, 'Variedad_Raw', 'Variedad_Canonica', 'Bronce.Ciclos_Fenologicos', conexion,
            columna_id_origen='ID_Ciclo_Fenologico',
        )
    print(f"2. Filas después de homologar variedad: {len(df)}")
    
    df_dedup = proc.pre_limpiar_duplicados_batch(
        df, [
            'Modulo_Raw', 'Fecha_Raw', 'Variedad_Raw', 
            'Etapa_Fenologica_Raw', 'Color_Raw', 'Organo_Raw', 
            'Valores_Raw'
        ]
    )
    print(f"3. Filas después de pre_limpiar_duplicados_batch: {len(df_dedup)}")
    
    # Diagnosticar por qué se descartan las filas
    print("\n=== Diagnóstico de descartes en payload ===")
    filas_ejemplo = df_dedup.to_dict('records')[:5]
    for i, fila in enumerate(filas_ejemplo):
        id_origen = int(fila['ID_Ciclo_Fenologico'])
        valores = proc.parsear_raw(fila.get('Valores_Raw'))
        fecha_str = valores.get('Fecha_detalle_Raw') or fila.get('Fecha_Raw')
        
        fecha = proc._validar_y_resolver_fecha(id_origen, fecha_str, 'ciclos_fenologicos')
        print(f"\nFila {i+1} (ID={id_origen}):")
        print(f"  Fecha_Raw: {fecha_str} -> Resuelta: {fecha}")
        if fecha is None:
            print("  [DESCARTADO] por Fecha")
            continue
            
        fundo = fila.get('Fundo_Raw')
        modulo_raw = fila.get('Modulo_Raw')
        turno = fila.get('Turno_Raw')
        valvula = fila.get('Valvula_Raw')
        
        resultado_geo = proc._validar_y_resolver_geografia(
            id_origen,
            fundo,
            modulo_raw,
            turno=turno,
            valvula=valvula,
        )
        print(f"  Geo (Fundo={fundo}, Modulo={modulo_raw}, Turno={turno}, Valvula={valvula}) -> Resuelta: {resultado_geo}")
        if resultado_geo is None:
            print("  [DESCARTADO] por Geografía")
            continue
            
        var_can = fila.get('Variedad_Canonica')
        var_raw = fila.get('Variedad_Raw')
        id_var = proc._validar_y_resolver_variedad(
            id_origen,
            var_can,
            var_raw,
        )
        print(f"  Variedad (Canonica={var_can}, Raw={var_raw}) -> Resuelta: {id_var}")
        if id_var is None:
            print("  [DESCARTADO] por Variedad")
            continue
            
        categoria = titulo(fila.get('Etapa_Fenologica_Raw') or valores.get('Stage_Raw') or valores.get('Categoria_Raw'))
        print(f"  Categoría: {categoria}")
        if not categoria:
            print("  [DESCARTADO] por Categoría vacía")
            continue
            
        print("  [APTO] ¡Esta fila debería haber entrante en el payload!")

if __name__ == '__main__':
    test_carga()
