import os
import glob
from pathlib import Path
import pandas as pd

workspace = Path("d:/Proyecto2026/ACP_DWH/ACP Proyecciones")
excels = []
for p in workspace.rglob("*.xlsx"):
    if ".claude" in p.parts or ".venv" in p.parts:
        continue
    if "induccion" in p.name.lower() or "floral" in p.name.lower():
        excels.append(p)

print(f"Found {len(excels)} floral induction excels:")
for e in excels:
    print(f"  Path: {e} ({e.stat().st_size / 1024:.1f} KB)")
    try:
        with pd.ExcelFile(str(e), engine='calamine') as xls:
            print(f"    Sheets: {xls.sheet_names}")
            # Read first few rows of the first sheet to see headers and data
            df = pd.read_excel(xls, sheet_name=xls.sheet_names[0], nrows=10, header=None)
            print("    First 5 rows:")
            for idx, r in df.head(5).iterrows():
                print(f"      Row {idx}: {list(r.values)}")
    except Exception as err:
        print(f"    Error reading: {err}")
