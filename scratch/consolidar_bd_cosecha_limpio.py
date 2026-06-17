import os
import pandas as pd
import glob

# Rutas de entrada y salida
folder_path = r'C:\Users\chernandez\Desktop\Nueva carpeta'
output_file = r'C:\Users\chernandez\Desktop\Consolidado_BD_Cosecha_Limpio.xlsx'

print("Iniciando la consolidación LIMPIA de pestañas BD_Cosecha...")

excel_files = glob.glob(os.path.join(folder_path, "*.xls*"))
all_data = []

for file_path in excel_files:
    filename = os.path.basename(file_path)
    
    try:
        xl = pd.ExcelFile(file_path)
        if 'BD_Cosecha' not in xl.sheet_names:
            print(f"[{filename}] Saltado: No contiene pestaña 'BD_Cosecha'")
            continue
            
        print(f"[{filename}] Leyendo pestaña 'BD_Cosecha'...")
        df = pd.read_excel(file_path, sheet_name='BD_Cosecha', header=3)
        
        # Quedarse SOLO con columnas que tengan un nombre real (excluir 'Unnamed')
        clean_cols = [col for col in df.columns if 'Unnamed' not in str(col)]
        df = df[clean_cols]
        
        # Eliminar filas vacías basándonos en la 'Fecha' (si existe)
        if 'Fecha' in df.columns:
            df = df.dropna(subset=['Fecha'])
            
        df['Archivo_Origen'] = filename
        all_data.append(df)
        print(f"[{filename}] Extraídas {len(df)} filas y {len(clean_cols)} columnas útiles.")
        
    except Exception as e:
        print(f"Error procesando {filename}: {e}")

if all_data:
    print("\nConcatenando todos los datos (solo columnas válidas)...")
    df_consolidado = pd.concat(all_data, ignore_index=True)
    
    print(f"Total de filas consolidadas: {len(df_consolidado)}")
    print(f"Total de columnas retenidas: {len(df_consolidado.columns)}")
    print("Guardando en el nuevo archivo Excel (esto puede tomar un minuto)...")
    
    df_consolidado.to_excel(output_file, index=False)
    print(f"\n¡Éxito! Archivo limpio guardado en: {output_file}")
else:
    print("\nNo se encontraron datos para consolidar.")
