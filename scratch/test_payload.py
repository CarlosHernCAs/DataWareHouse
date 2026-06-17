import sys, os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ETL"))

from config.conexion import obtener_engine
from silver.facts.fact_evaluacion_vegetativa import ProcesadorEvaluacionVegetativa
from mdm.homologador import homologar_columna
from utils.contexto_transaccional import ContextoTransaccionalETL
from sqlalchemy import text

engine = obtener_engine()
proc = ProcesadorEvaluacionVegetativa(engine)

cols_raw = [
    'Fecha_Raw', 'Campana_Raw', 'Modulo_Raw', 'Turno_Raw', 'Valvula_Raw', 'Cama_Raw',
    'Variedad_Raw', 'Evaluador_Raw', 'DNI_Raw', 'Semanas_Poda_Raw',
    'Altura_Raw', 'Tallos_Basales_Raw', 'Tallos_Basales_Nuevos_Raw', 'Muestra_Plantas_Raw',
    'Piso1_Brotes_Raw', 'Piso1_Productivos_Raw', 'Piso1_Diametro_Raw',
    'Piso2_Brotes_Raw', 'Piso2_Productivos_Raw', 'Piso2_Diametro_Raw',
    'Piso3_Brotes_Raw', 'Piso3_Productivos_Raw', 'Piso3_Diametro_Raw',
    'Piso4_Brotes_Raw', 'Piso4_Productivos_Raw', 'Piso4_Diametro_Raw',
    'Piso5_Brotes_Raw', 'Piso5_Productivos_Raw', 'Piso5_Diametro_Raw',
]

df = proc.leer_bronce(cols_raw)
print(f"Leídos {len(df)} registros de Bronce.")

with ContextoTransaccionalETL(engine) as contexto:
    conexion = contexto._conexion_activa()
    df, cuar_var = homologar_columna(
        df, 'Variedad_Raw', 'Variedad_Canonica', 'Bronce.Evaluacion_Vegetativa', conexion,
        columna_id_origen='ID_Evaluacion_Veg',
    )
    payload = proc._construir_payload(df)
    print(f"Payload construido: {len(payload)} filas.")
    
    # Asignar ID_Campana dummy constante
    for row in payload:
        row['ID_Campana'] = 1

    todas_cols = list(payload[0].keys())
    cols_con_tipos = [(col, proc._inferir_tipo_columna(payload, col)) for col in todas_cols]
    datos = [tuple(row.get(c) for c in todas_cols) for row in payload]

    nombre_temp = "#Temp_Test_Veg"
    cols_ddl = ', '.join(f'[{col}] {tipo}' for col, tipo in cols_con_tipos)
    cols_quoted = ', '.join(f'[{col}]' for col, _ in cols_con_tipos)
    placeholders = ', '.join('?' for _ in cols_con_tipos)

    sql_insert = f"INSERT INTO {nombre_temp} ({cols_quoted}) VALUES ({placeholders})"
    
    # Intento 1: Con fast_executemany = True
    print("\n--- Intento 1: Inserción con fast_executemany = True ---")
    conexion.execute(text(f"IF OBJECT_ID('tempdb..{nombre_temp}') IS NOT NULL DROP TABLE {nombre_temp}"))
    conexion.execute(text(f"CREATE TABLE {nombre_temp} ({cols_ddl})"))
    
    dbapi_conn = conexion.connection.dbapi_connection
    cursor = dbapi_conn.cursor()
    cursor.fast_executemany = True
    try:
        cursor.executemany(sql_insert, datos[:10000])
        print("  ¡ÉXITO! La inserción con fast_executemany = True funcionó.")
    except Exception as ex:
        print(f"  FALLÓ: {type(ex).__name__}: {ex}")
    finally:
        cursor.close()

    # Intento 2: Con fast_executemany = False
    print("\n--- Intento 2: Inserción con fast_executemany = False ---")
    conexion.execute(text(f"IF OBJECT_ID('tempdb..{nombre_temp}') IS NOT NULL DROP TABLE {nombre_temp}"))
    conexion.execute(text(f"CREATE TABLE {nombre_temp} ({cols_ddl})"))
    
    cursor2 = dbapi_conn.cursor()
    cursor2.fast_executemany = False
    try:
        cursor2.executemany(sql_insert, datos[:10000])
        print("  ¡ÉXITO! La inserción con fast_executemany = False funcionó.")
    except Exception as ex:
        print(f"  FALLÓ: {type(ex).__name__}: {ex}")
    finally:
        cursor2.close()
