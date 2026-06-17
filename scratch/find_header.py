import pandas as pd

file_path = r'C:\Users\chernandez\Desktop\Nueva carpeta\Reporte de Cosecha Arándano 2025.xlsx'

xl = pd.ExcelFile(file_path)
sheet_name = xl.sheet_names[0]
df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=100)

# Find the first row with at least 5 non-null values
for idx, row in df.iterrows():
    if row.notna().sum() > 5:
        print(f"La fila {idx+2} de Excel parece ser el inicio real de datos o cabeceras.")
        print(row.dropna().head(20).to_string())
        
        print("\nSiguientes 3 filas:")
        print(df.iloc[idx+1:idx+4].dropna(axis=1, how='all').head(3).to_string())
        break
