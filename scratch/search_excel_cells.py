import pandas as pd
from pathlib import Path

file_path = Path("ETL/data/procesados/induccion_floral/Inducción Floral - Floración Campaña 2025_20260604_121652.xlsx")
if not file_path.exists():
    import glob
    matches = glob.glob("ETL/data/procesados/induccion_floral/Inducci*n Floral - Floraci*n*.xlsx")
    if matches:
        file_path = Path(matches[0])

print(f"Searching in file: {file_path}")
with pd.ExcelFile(str(file_path), engine='calamine') as xls:
    for sheet in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet, header=None)
        # Search for 932 or 5349 in the dataframe
        mask = df.isin([932, 5349, 932.0, 5349.0])
        rows_matching = df[mask.any(axis=1)]
        if not rows_matching.empty:
            print(f"\n--- Found match in sheet '{sheet}' ---")
            # Find header row
            header_idx = None
            for idx, r in df.head(10).iterrows():
                row_str = ' '.join([str(x).upper() for x in r.values])
                if 'MODULO' in row_str or 'VARIEDAD' in row_str or 'VALVULA' in row_str:
                    header_idx = idx
                    print(f"Header row at index {idx}: {list(df.loc[idx].values)}")
                    break
            
            for idx, r in rows_matching.iterrows():
                print(f"Row {idx}: {list(r.values)}")
