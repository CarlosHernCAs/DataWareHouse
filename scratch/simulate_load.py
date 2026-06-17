import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ETL'))
import pandas as pd
from config.conexion import obtener_engine
from bronce.cargador import normalizar_columnas, castear_todo_a_texto
from silver.facts.fact_ciclos_fenologicos import ProcesadorCiclosFenologicos
from mdm.homologador import homologar_columna

def simulate():
    engine = obtener_engine()
    proc = ProcesadorCiclosFenologicos(engine)
    
    file_path = "d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/data/procesados/ciclos_fenologicos/Ciclos_Fenologicos_20260603_102618.xlsx"
    print("Reading Excel...")
    df = pd.read_excel(file_path, sheet_name=0, header=1, dtype=str, engine='calamine')
    df = normalizar_columnas(df)
    df = castear_todo_a_texto(df)
    
    # Simulating the pipeline flow:
    df['ID_Ciclo_Fenologico'] = range(len(df))
    df, _ = homologar_columna(df, 'Variedad_Raw', 'Variedad_Canonica', 'Bronce.Ciclos_Fenologicos', engine)
    
    # Add Valores_Raw if not present (since in real pipeline it's populated during Bronce load)
    if 'Valores_Raw' not in df.columns:
        df['Valores_Raw'] = None
    
    # We need to derive date
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
    
    print(f"Resolved rows: {len(df_resolved)}")
    if df_resolved.empty:
        return

    # Check payload construction
    print("Running _construir_payload...")
    payload = proc._construir_payload(df_resolved)
    print(f"Payload size: {len(payload)}")
    
    if len(payload) == 0:
        # Debug why it is empty
        # Let's inspect a few rows in detail
        from utils.texto import titulo
        from mdm.lookup import obtener_id_estado_fenologico, obtener_id_cinta
        
        row = df_resolved.iloc[0]
        v_r = pd.Series([None]*len(row), index=row.index) # since Valores_Raw is None/empty
        
        print("\n=== Debugging Row 0 ===")
        print("Row keys and values:")
        for k, v in row.items():
            print(f"  {k}: {v}")
            
        categoria_raw = titulo(row.get('Etapa_Fenologica_Raw') or v_r.get('Stage_Raw') or v_r.get('Categoria_Raw'))
        print(f"categoria_raw: {categoria_raw}")
        id_estado = obtener_id_estado_fenologico(categoria_raw, proc.engine)
        print(f"id_estado: {id_estado}")
        
        color_val = (row.get('Color_Raw') or '').strip() or None
        print(f"color_val: {color_val}")
        id_cinta = obtener_id_cinta(color_val, proc.engine)
        print(f"id_cinta: {id_cinta}")
        
        organo_val = (row.get('Organo_Raw') or '').strip() or None
        print(f"organo_val: {organo_val}")
        
        # Let's test all rows
        print("\n=== Running check for all rows ===")
        missing_estado = 0
        total_rows = len(df_resolved)
        for idx, r in df_resolved.iterrows():
            cat = titulo(r.get('Etapa_Fenologica_Raw'))
            ide = obtener_id_estado_fenologico(cat, proc.engine)
            if ide is None:
                missing_estado += 1
        print(f"Total rows: {total_rows} | Rows with missing estado_fenologico: {missing_estado}")
    else:
        print("\n=== Payload sample (first row) ===")
        print(payload[0])

if __name__ == "__main__":
    simulate()
