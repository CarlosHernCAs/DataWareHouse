import pandas as pd
from pathlib import Path

file_path = Path("ETL/data/procesados/induccion_floral/Inducción Floral - Floración Campaña 2025_20260604_121652.xlsx")
if not file_path.exists():
    # Try finding any file starting with "Inducción Floral - Floración"
    import glob
    matches = glob.glob("ETL/data/procesados/induccion_floral/Inducci*n Floral - Floraci*n*.xlsx")
    if matches:
        file_path = Path(matches[0])

print(f"Reading file: {file_path}")
with pd.ExcelFile(str(file_path), engine='calamine') as xls:
    print(f"Sheets: {xls.sheet_names}")
    for sheet in ['BD Inducción', 'Base de Datos']:
        if sheet in xls.sheet_names:
            print(f"\n--- Sheet: {sheet} ---")
            df = pd.read_excel(xls, sheet_name=sheet, nrows=10, header=None)
            print("First 10 rows:")
            for idx, r in df.iterrows():
                print(f"  Row {idx}: {list(r.values[:18])}")
