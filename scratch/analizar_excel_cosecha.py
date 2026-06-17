import pandas as pd
import sys

file_path = r'C:\Users\chernandez\Desktop\Nueva carpeta\Reporte de Cosecha Arándano 2025.xlsx'

print(f"Analizando: {file_path}")
try:
    xl = pd.ExcelFile(file_path)
    print("Pestañas disponibles:", xl.sheet_names)
    
    # Procesaremos la primera pestaña asumiendo que ahí están los datos
    sheet_name = xl.sheet_names[0]
    print(f"\nAnalizando la primera pestaña: '{sheet_name}'")
    
    # Leer un chunk de filas para encontrar el verdadero encabezado
    # Ya sabemos que las primeras filas son texto con NaNs.
    df_raw = pd.read_excel(file_path, sheet_name=sheet_name, nrows=30)
    
    # Buscar la fila que tiene la mayor cantidad de columnas no nulas,
    # que típicamente es la fila de encabezados en un reporte de Excel.
    non_null_counts = df_raw.notna().sum(axis=1)
    header_row_idx = non_null_counts.idxmax()
    
    print(f"\nSe detectó que los encabezados reales probablemente empiezan en la fila de Excel {header_row_idx + 2} (índice {header_row_idx})")
    
    # Volver a cargar saltando las filas basura
    df = pd.read_excel(file_path, sheet_name=sheet_name, skiprows=header_row_idx, nrows=10)
    
    print("\nColumnas detectadas:")
    for col in df.columns:
        print(f" - {col}")
        
    print("\nPrimeras 2 filas de datos limpios:")
    print(df.head(2).to_string())
    
except Exception as e:
    print("Error leyendo el archivo:", e)
