import os
import pandas as pd

folder_path = r'C:\Users\chernandez\Desktop\Nueva carpeta'

print(f"Analizando archivos en: {folder_path}\n")

for filename in sorted(os.listdir(folder_path)):
    if filename.endswith(".xlsx") or filename.endswith(".xls"):
        file_path = os.path.join(folder_path, filename)
        try:
            xl = pd.ExcelFile(file_path)
            sheet_names = xl.sheet_names
            
            # Buscar pestañas que parezcan bases de datos
            data_sheets = [s for s in sheet_names if 'data' in s.lower() or 'bd' in s.lower() or 'base' in s.lower()]
            
            print(f"[{filename}] Pestañas: {sheet_names}")
            
            for s_name in data_sheets:
                try:
                    df = pd.read_excel(file_path, sheet_name=s_name, nrows=5)
                    print(f"   -> Encontrada pestaña de datos '{s_name}'. Columnas:")
                    print(f"      {df.columns.tolist()}")
                except Exception as e2:
                    print(f"   -> Error leyendo pestaña '{s_name}': {e2}")
            print("-" * 50)
            
        except Exception as e:
            print(f"Error procesando {filename}: {e}")
