import sys
import os
import pandas as pd
from pathlib import Path

# Add ETL to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../ETL")))

from bronce.cargador import _proyectar_dataframe_induccion_floral_bronce, normalizar_columnas, _normalizar_nombre_columna_base, _alias

def test_parsing():
    file_path = Path("ETL/data/procesados/induccion_floral/Inducción Floral - Floración Campaña 2025_20260604_110028.xlsx")
    if not file_path.exists():
        print(f"File not found: {file_path}")
        return
        
    print(f"File size: {file_path.stat().st_size / 1024 / 1024:.2f} MB")
    
    # 1. Dynamic header detection
    df_raw = pd.read_excel(str(file_path), header=None, nrows=10, engine='calamine')
    header_idx = 0
    for i, row in df_raw.iterrows():
        fila_str = ' '.join([str(x).upper() for x in row.values])
        if ('MODULO' in fila_str or 'MÓDULO' in fila_str) and 'VARIEDAD' in fila_str:
            header_idx = i
            break
            
    print(f"Detected header_idx: {header_idx}")
    
    # Update ALIAS_COLUMNAS in memory for testing
    import bronce.cargador as cargador
    cargador._ALIAS_COLUMNAS['Plantas_Evaluadas'] = 'PlantasPorCama'
    cargador._ALIAS_COLUMNAS['Plantas_con_Floracion'] = 'PlantasConInduccion'
    cargador._ALIAS_COLUMNAS['Brotes_con_Induccion_Planta'] = 'BrotesConInduccion'
    cargador._ALIAS_COLUMNAS['Brotes_Planta'] = 'BrotesTotales'
    cargador._ALIAS_COLUMNAS['Flor'] = 'BrotesConFlor'
    
    # Rebuild casefold aliases
    cargador._ALIAS_COLUMNAS_CASEFOLD = {
        str(clave).casefold(): valor
        for clave, valor in cargador._ALIAS_COLUMNAS.items()
    }
    
    # Read sheet with detected header
    df = pd.read_excel(str(file_path), header=header_idx, engine='calamine', nrows=5)
    print("\nOriginal columns:")
    for col in df.columns:
        col_base = _normalizar_nombre_columna_base(col)
        col_alias = _alias(col_base)
        print(f"  {col:<40} -> base: {col_base:<30} -> alias: {col_alias}")
        
    df_normalized = normalizar_columnas(df)
    print("\nNormalized columns:")
    for col in df_normalized.columns:
        print(f"  {col}")

if __name__ == '__main__':
    test_parsing()
