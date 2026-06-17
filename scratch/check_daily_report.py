import pandas as pd
from pathlib import Path

file_path = Path("ETL/data/procesados/induccion_floral/Reporte Inducción Floral_20260528_102219.xlsx")
if not file_path.exists():
    print(f"File not found: {file_path}")
    sys.exit(1)

print(f"Reading file: {file_path}")
df = pd.read_excel(file_path, header=1) # The header is in row 1
print(f"Total rows in sheet: {len(df)}")
print("Columns:")
print(list(df.columns))

# Find columns
col_total = 'Plantas por Cama'
col_ind = 'Plantas con Inducción'

# Filter to rows where they are equal
eq_rows = df[df[col_total] == df[col_ind]]
print(f"Rows where {col_total} == {col_ind}: {len(eq_rows)}")

# Print some stats of eq_rows
print("\nSample equal rows:")
print(eq_rows[['Fecha Evaluación', 'Modulo', 'Turno', 'Valvula', col_total, col_ind]].head(10))

# Print count of rows where they are NOT equal
neq_rows = df[df[col_total] != df[col_ind]]
print(f"\nRows where they are NOT equal: {len(neq_rows)}")
print("\nSample not equal rows:")
print(neq_rows[['Fecha Evaluación', 'Modulo', 'Turno', 'Valvula', col_total, col_ind]].head(10))
