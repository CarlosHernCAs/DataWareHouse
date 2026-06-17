import pandas as pd

file_path = r'd:\Proyecto2026\ACP_DWH\ACP Proyecciones\data\entrada\reporte_cosecha\Consolidado_BD_Cosecha_Para_ETL.xlsx'
df = pd.read_excel(file_path)

print(f"Total de filas en el Excel consolidado: {len(df):,}")

# Filtrar las que tienen las columnas minimas para que no rompa por Nulos
df_valid = df.dropna(subset=['Fecha', 'Modulo', 'Variedad', 'KgNeto'])
print(f"Filas validas (tienen Fecha, Modulo, Variedad y KgNeto): {len(df_valid):,}")

# 1. Simulacion de dedup CON KgNeto (como esta configurado el ETL de Silver actualmente)
dedup_actual = df_valid.drop_duplicates(subset=['Fecha', 'Modulo', 'Variedad', 'KgNeto'])
bloqueados_actual = len(df_valid) - len(dedup_actual)

print("\n--- SIMULACION 1: Granularidad ACTUAL del ETL ---")
print("Grano: [Fecha + Modulo + Variedad + KgNeto]")
print(f"Filas que pasarian a Silver: {len(dedup_actual):,}")
print(f"Filas bloqueadas por ser duplicadas exactas: {bloqueados_actual:,}")

# 2. Simulacion de dedup SIN KgNeto (lo que querias probar con SAP)
dedup_sin_kg = df_valid.drop_duplicates(subset=['Fecha', 'Modulo', 'Variedad'])
bloqueados_sin_kg = len(df_valid) - len(dedup_sin_kg)
falsos_duplicados = len(dedup_actual) - len(dedup_sin_kg)

print("\n--- SIMULACION 2: Granularidad SIN KgNeto ---")
print("Grano: [Fecha + Modulo + Variedad]")
print(f"Filas que pasarian a Silver: {len(dedup_sin_kg):,}")
print(f"Filas bloqueadas (colisiones): {bloqueados_sin_kg:,}")
print(f"-> Peligro: Se eliminarian {falsos_duplicados:,} filas validas adicionales (ej: mismo dia, mismo modulo, pero dos pesajes distintos).")
