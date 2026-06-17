import pandas as pd
from pathlib import Path

file_path = Path("ETL/data/procesados/induccion_floral/Inducción Floral - Floración Campaña 2025_20260604_121652.xlsx")
if not file_path.exists():
    import glob
    matches = glob.glob("ETL/data/procesados/induccion_floral/Inducci*n Floral - Floraci*n*.xlsx")
    if matches:
        file_path = Path(matches[0])

print(f"Reading file: {file_path}")
df = pd.read_excel(file_path, sheet_name='BD Inducción')
print("Columns in dataframe:")
for idx, col in enumerate(df.columns):
    print(f"  {idx}: {repr(col)}")

# Find columns by keyword to be safe
col_total_plants = [c for c in df.columns if "plantas por cama" in str(c).lower()][0]
col_ind_plants = [c for c in df.columns if "plantas con" in str(c).lower()][0]

print(f"\nUsing columns:\n  Total plants: {repr(col_total_plants)}\n  Induction plants: {repr(col_ind_plants)}")

# Filter to rows where Total plants == Induction plants
eq_rows = df[df[col_total_plants] == df[col_ind_plants]]
print(f"\nTotal rows in sheet: {len(df)}")
print(f"Rows where Total plants == Induction plants: {len(eq_rows)}")

# Print some stats of eq_rows
print("\nSample equal rows:")
print(eq_rows[['Fecha', col_total_plants, col_ind_plants]].head(10))

# Print count of rows where they are NOT equal
neq_rows = df[df[col_total_plants] != df[col_ind_plants]]
print(f"\nRows where they are NOT equal: {len(neq_rows)}")
print("\nSample not equal rows:")
print(neq_rows[['Fecha', col_total_plants, col_ind_plants]].head(10))
