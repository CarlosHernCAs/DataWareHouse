import pandas as pd
import sys

file_path = r'C:\Users\chernandez\Desktop\Nueva carpeta\Reporte de Cosecha Arándano 2025.xlsx'

try:
    xl = pd.ExcelFile(file_path)
    sheet_name = xl.sheet_names[0]
    
    # Read first 15 rows, first 15 columns without skipping
    df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=20, usecols="A:O")
    
    print("Muestra de las primeras 20 filas y 15 columnas del archivo:")
    print(df.to_string())
    
except Exception as e:
    print("Error leyendo el archivo:", e)
