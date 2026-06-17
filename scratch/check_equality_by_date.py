import pandas as pd
from pathlib import Path

file_path = Path("ETL/data/procesados/induccion_floral/Inducción Floral - Floración Campaña 2025_20260604_121652.xlsx")
if not file_path.exists():
    import glob
    matches = glob.glob("ETL/data/procesados/induccion_floral/Inducci*n Floral - Floraci*n*.xlsx")
    if matches:
        file_path = Path(matches[0])

df = pd.read_excel(file_path, sheet_name='BD Inducción')

# Find columns
col_total = [c for c in df.columns if "plantas por cama" in str(c).lower()][0]
col_ind = [c for c in df.columns if "plantas con" in str(c).lower()][0]

df['Is_Equal'] = df[col_total] == df[col_ind]
df['Fecha_str'] = pd.to_datetime(df['Fecha']).dt.strftime('%Y-%m-%d')

# Group by date and calculate count and % equal
grouped = df.groupby('Fecha_str').agg(
    Total_Rows=('Is_Equal', 'count'),
    Equal_Rows=('Is_Equal', 'sum'),
)
grouped['Equal_Pct'] = (grouped['Equal_Rows'] / grouped['Total_Rows'] * 100).round(2)

print("Equality by Date:")
print(grouped.to_string())
