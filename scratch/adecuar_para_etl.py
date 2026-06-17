import os
import pandas as pd
import numpy as np
import datetime

input_file = r'C:\Users\chernandez\Desktop\Consolidado_BD_Cosecha_Limpio.xlsx'
output_dir = r'd:\Proyecto2026\ACP_DWH\ACP Proyecciones\data\entrada\reporte_cosecha'
output_file = os.path.join(output_dir, 'Consolidado_BD_Cosecha_Para_ETL.xlsx')

print("Leyendo archivo consolidado...")
df = pd.read_excel(input_file)

# 1. Eliminar columnas basura (fechas, nros, turnos colados)
cols_to_keep = []
for col in df.columns:
    col_str = str(col).strip()
    
    # Ignorar columnas Unnamed
    if 'Unnamed' in col_str:
        continue
    # Ignorar fechas
    if isinstance(col, datetime.datetime) or isinstance(col, datetime.date):
        continue
    # Ignorar puros numeros o numeros flotantes (ej. 112.09, 22)
    if col_str.replace('.', '', 1).isdigit():
        continue
    # Ignorar meses, dias o nombres especificos colados
    if col_str.lower() in ['mayo', 'miércoles', 'miercoles', ' ']:
        continue
    if 'Turno 4' in col_str or 'SEKOYA' in col_str.upper():
        continue
        
    cols_to_keep.append(col)

df = df[cols_to_keep]

# Unificar Variedad: algunos anos usan 'AuxVariedades' y otros 'Variedad Asignada' o 'Traz. Variedad '
if 'AuxVariedades' in df.columns and 'Variedad Asignada' in df.columns:
    df['Variedad_Final'] = df['AuxVariedades'].fillna(df['Variedad Asignada'])
elif 'AuxVariedades' in df.columns:
    df['Variedad_Final'] = df['AuxVariedades']
elif 'Variedad Asignada' in df.columns:
    df['Variedad_Final'] = df['Variedad Asignada']

if 'Traz. Variedad ' in df.columns:
    # Si aun hay nulos, intentar con Traz. Variedad
    if 'Variedad_Final' in df.columns:
        df['Variedad_Final'] = df['Variedad_Final'].fillna(df['Traz. Variedad '])
    else:
        df['Variedad_Final'] = df['Traz. Variedad ']

# 2. Renombrar columnas clave para el ETL
rename_map = {}
for col in df.columns:
    col_str = str(col).strip()
    
    if col_str == 'M': rename_map[col] = 'Modulo'
    elif col_str == 'T': rename_map[col] = 'Turno'
    elif 'vlvula' in col_str.lower() or 'válvula' in col_str.lower() or 'valvula' in col_str.lower():
        # Tomar la primera valvula que encontremos
        if 'Valvula' not in rename_map.values():
            rename_map[col] = 'Valvula'
    elif col_str == 'Variedad_Final': rename_map[col] = 'Variedad'
    elif col_str == 'Kg Total': rename_map[col] = 'KgNeto'
    elif col_str == 'N Jabas' or col_str == 'N° Jabas': rename_map[col] = 'Jabas'

df.rename(columns=rename_map, inplace=True)

# 3. Guardar el archivo en la carpeta del ETL
os.makedirs(output_dir, exist_ok=True)
print(f"Guardando archivo adecuado para ETL en:\n{output_file}...")
df.to_excel(output_file, index=False)
print("¡Archivo guardado con éxito! Listo para el ETL.")
