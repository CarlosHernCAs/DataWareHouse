import pandas as pd
from pathlib import Path

def inspect():
    root = Path("d:/Proyecto2026/ACP_DWH/ACP Proyecciones")
    path = root / "ETL/data/procesados/ciclos_fenologicos/Ciclos Fenologicos_20260604_110026.xlsx"
    if not path.exists():
        print(f"File {path} not found")
        return
    
    df = pd.read_excel(str(path), sheet_name=0, header=None, nrows=10)
    print("Shape:", df.shape)
    for idx, row in df.iterrows():
        print(f"Row {idx}: {list(row.values)}")

if __name__ == "__main__":
    inspect()
