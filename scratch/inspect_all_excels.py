import pandas as pd
from pathlib import Path

def inspect():
    root = Path("d:/Proyecto2026/ACP_DWH/ACP Proyecciones")
    dirs = [
        root / "ETL/data/procesados/ciclos_fenologicos",
        root / "ETL/data/entrada/ciclos_fenologicos"
    ]
    for folder in dirs:
        if not folder.exists():
            continue
        print(f"=== Folder: {folder.name} ===")
        for file in folder.glob("*.xlsx"):
            print(f"File: {file.name}")
            try:
                df = pd.read_excel(str(file), sheet_name=0, header=None, nrows=3)
                print(f"  Row 0: {list(df.iloc[0].values)}")
                print(f"  Row 1: {list(df.iloc[1].values)}")
                print(f"  Row 2: {list(df.iloc[2].values)}")
            except Exception as e:
                print(f"  Error reading {file.name}: {e}")

if __name__ == "__main__":
    inspect()
