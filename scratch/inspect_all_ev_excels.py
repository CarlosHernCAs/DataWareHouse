import os
from pathlib import Path
import pandas as pd

def inspect_all():
    files = [
        r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data\procesados\evaluacion_vegetativa\historico_vegetativa_20260603_162617.xlsx",
        r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data\procesados\evaluacion_vegetativa_v2\historico_vegetativa_20260603_153835.xlsx",
        r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data\rechazados\evaluacion_vegetativa\historico_vegetativa_LAYOUT_INCOMPATIBLE_20260526_164402.xlsx",
        r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data\rechazados\evaluacion_vegetativa\Evaluación Vegetativa Arándanos .xlsx",
        r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data\rechazados\ciclos_fenologicos\Evaluación Vegetativa Arándano _RUTA_CONTENIDO_INCOMPATIBLE_20260326_120606.xlsx"
    ]
    for filepath in files:
        path = Path(filepath)
        print(f"\n==========================================")
        print(f"File: {path.name}")
        if not path.exists():
            print("Does not exist!")
            continue
        print(f"Size: {path.stat().st_size / (1024*1024):.2f} MB")
        try:
            xl = pd.ExcelFile(path)
            print(f"Sheets: {xl.sheet_names}")
            for sh in xl.sheet_names:
                # Read shape
                df = pd.read_excel(path, sheet_name=sh, nrows=2)
                print(f"  Sheet: {sh} | Columns: {list(df.columns)}")
                # Count rows
                df_all = pd.read_excel(path, sheet_name=sh, usecols=[0])
                print(f"  Sheet: {sh} | Total rows: {len(df_all) + 1}")
        except Exception as e:
            print(f"Error reading: {e}")

if __name__ == '__main__':
    inspect_all()
