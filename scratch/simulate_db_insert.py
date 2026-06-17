import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ETL'))
import pandas as pd
from config.conexion import obtener_engine
from bronce.cargador import normalizar_columnas, castear_todo_a_texto
from silver.facts.fact_ciclos_fenologicos import ProcesadorCiclosFenologicos
from mdm.homologador import homologar_columna
from sqlalchemy import text

def simulate():
    engine = obtener_engine()
    proc = ProcesadorCiclosFenologicos(engine)
    
    file_path = "d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/data/procesados/ciclos_fenologicos/Ciclos_Fenologicos_20260603_102618.xlsx"
    df = pd.read_excel(file_path, sheet_name=0, header=1, dtype=str, engine='calamine')
    df = normalizar_columnas(df)
    df = castear_todo_a_texto(df)
    
    df['ID_Ciclo_Fenologico'] = range(len(df))
    df, _ = homologar_columna(df, 'Variedad_Raw', 'Variedad_Canonica', 'Bronce.Ciclos_Fenologicos', engine)
    
    if 'Valores_Raw' not in df.columns:
        df['Valores_Raw'] = None
    
    v_raw_df = pd.DataFrame([proc.parsear_raw(x) for x in df['Valores_Raw']], index=df.index)
    
    def _get_fecha_ciclo(r_fecha, v_r):
        fecha_str = v_r.get('Fecha_detalle_Raw') or r_fecha
        if not fecha_str or str(fecha_str).strip() in ('', 'None', 'nan'):
            fecha_str = '2015-01-01'
        return str(fecha_str)

    df['_Deriv_Fecha_Temp'] = [
        _get_fecha_ciclo(df.loc[idx, 'Fecha_Raw'], v_raw_df.loc[idx])
        for idx in df.index
    ]
    
    df_resolved = proc.resolver_dimensiones_batch(
        df,
        col_fecha='_Deriv_Fecha_Temp',
        col_modulo='Modulo_Raw',
        col_variedad='Variedad_Canonica',
        col_fundo='Fundo_Raw',
        col_turno='Turno_Raw',
        col_valvula='Valvula_Raw',
        dominio_fecha='ciclos_fenologicos'
    )
    
    payload = proc._construir_payload(df_resolved)
    
    # 2. Check match in DB for first 5 rows
    with engine.connect() as conn:
        print("=== Checking matches in DB ===")
        for i in range(min(5, len(payload))):
            row = payload[i]
            print(f"\nChecking Row {i}: ID_Geografia={row['ID_Geografia']}, ID_Tiempo={row['ID_Tiempo']}, ID_Variedad={row['ID_Variedad']}, Cama={row['Cama']}, Tipo_Evaluacion={row['Tipo_Evaluacion']}, ID_Estado_Fenologico={row['ID_Estado_Fenologico']}")
            
            query = """
                SELECT * FROM Silver.Fact_Ciclos_Fenologicos
                WHERE ID_Geografia = :geo
                  AND ID_Tiempo = :tiempo
                  AND ID_Variedad = :var
                  AND (Cama = :cama OR (Cama IS NULL AND :cama IS NULL))
                  AND Tipo_Evaluacion = :eval
                  AND ID_Estado_Fenologico = :est
            """
            matches = conn.execute(text(query), {
                "geo": int(row['ID_Geografia']),
                "tiempo": int(row['ID_Tiempo']),
                "var": int(row['ID_Variedad']),
                "cama": row['Cama'],
                "eval": row['Tipo_Evaluacion'],
                "est": int(row['ID_Estado_Fenologico'])
            }).fetchall()
            
            print(f"Matches found: {len(matches)}")
            for m in matches:
                print(dict(m._mapping))

if __name__ == "__main__":
    simulate()
