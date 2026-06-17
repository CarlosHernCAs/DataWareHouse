import os
import pandas as pd
import glob

# Rutas de entrada y salida
folder_path = r'C:\Users\chernandez\Desktop\Nueva carpeta'
output_file = r'C:\Users\chernandez\Desktop\Consolidado_BD_Cosecha.xlsx'

print("Iniciando la consolidación de pestañas BD_Cosecha...")

# Buscar todos los archivos Excel en la carpeta
excel_files = glob.glob(os.path.join(folder_path, "*.xls*"))

all_data = []

for file_path in excel_files:
    filename = os.path.basename(file_path)
    
    try:
        # Verificar si existe la pestaña 'BD_Cosecha'
        xl = pd.ExcelFile(file_path)
        if 'BD_Cosecha' not in xl.sheet_names:
            print(f"[{filename}] Saltado: No contiene pestaña 'BD_Cosecha'")
            continue
            
        print(f"[{filename}] Leyendo pestaña 'BD_Cosecha'...")
        
        # Leer usando header=3 porque sabemos que la fila 4 (índice 3) tiene los verdaderos nombres de columna
        df = pd.read_excel(file_path, sheet_name='BD_Cosecha', header=3)
        
        # Limpiar columnas 'Unnamed' y filas vacías
        df = df.dropna(axis=1, how='all')
        
        # Opcional: Eliminar filas donde la fecha o módulo esté vacío (suele ser basura del final del Excel)
        if 'Fecha' in df.columns:
            df = df.dropna(subset=['Fecha'])
            
        # Añadir una columna indicando de qué archivo vino
        df['Archivo_Origen'] = filename
        
        all_data.append(df)
        print(f"[{filename}] Extraídas {len(df)} filas.")
        
    except Exception as e:
        print(f"Error procesando {filename}: {e}")

if all_data:
    print("\nConcatenando todos los datos...")
    df_consolidado = pd.concat(all_data, ignore_index=True)
    
    print(f"Total de filas consolidadas: {len(df_consolidado)}")
    print("Guardando en el nuevo archivo Excel (esto puede tomar un minuto)...")
    
    # Escribir a Excel
    df_consolidado.to_excel(output_file, index=False)
    print(f"\n¡Éxito! Archivo guardado en: {output_file}")
else:
    print("\nNo se encontraron datos para consolidar.")
