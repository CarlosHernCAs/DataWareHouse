import os
import pandas as pd

def inspect_excel(ruta):
    print(f"\n=== Inspeccionando: {os.path.basename(ruta)} ===")
    if not os.path.exists(ruta):
        print("Archivo no existe.")
        return
        
    try:
        xl = pd.ExcelFile(ruta)
        print(f"Hojas: {xl.sheet_names}")
        for hoja in xl.sheet_names[:2]: # Ver las primeras 2 hojas
            df = pd.read_excel(ruta, sheet_name=hoja, nrows=5)
            print(f"\nHoja: {hoja}")
            print(f"Columnas: {list(df.columns)}")
            print("Primeras 3 filas:")
            print(df.head(3).to_dict('records'))
    except Exception as e:
        print(f"Error al leer Excel: {e}")

if __name__ == '__main__':
    base_dir = r"D:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data\procesados\peladas"
    inspect_excel(os.path.join(base_dir, "Peladas_V2_20260528_093609_20260528_112946.xlsx"))
