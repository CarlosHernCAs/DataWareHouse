import pandas as pd
from pathlib import Path

def inspect():
    root = Path("d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/data/procesados/ciclos_fenologicos")
    for file in root.glob("*.xlsx"):
        try:
            df = pd.read_excel(str(file), sheet_name=0, header=None)
            print(f"File: {file.name} | Rows: {len(df)}")
        except Exception as e:
            print(f"Error reading {file.name}: {e}")

if __name__ == "__main__":
    inspect()
