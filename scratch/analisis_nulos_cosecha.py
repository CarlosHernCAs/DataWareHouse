import pandas as pd

file_path = r'd:\Proyecto2026\ACP_DWH\ACP Proyecciones\data\entrada\reporte_cosecha\Consolidado_BD_Cosecha_Para_ETL.xlsx'
df = pd.read_excel(file_path)

tot_filas = len(df)
nulos_fecha = df['Fecha'].isna().sum() if 'Fecha' in df.columns else tot_filas
nulos_modulo = df['Modulo'].isna().sum() if 'Modulo' in df.columns else tot_filas
nulos_variedad = df['Variedad'].isna().sum() if 'Variedad' in df.columns else tot_filas
nulos_kg = df['KgNeto'].isna().sum() if 'KgNeto' in df.columns else tot_filas

print(f"Total Filas: {tot_filas:,}")
print(f"Nulos en Fecha: {nulos_fecha:,}")
print(f"Nulos en Modulo: {nulos_modulo:,}")
print(f"Nulos en Variedad: {nulos_variedad:,}")
print(f"Nulos en KgNeto: {nulos_kg:,}")

df_nulos = df[df[['Fecha', 'Modulo', 'Variedad', 'KgNeto']].isna().any(axis=1)]
if not df_nulos.empty:
    print("\nMuestra de las filas que se caen (primeras 5):")
    cols_to_show = [c for c in ['Fecha', 'Modulo', 'Variedad', 'KgNeto', 'Módulo Asignado', 'Mdulo Asignado', 'Variedad Asignada'] if c in df.columns]
    print(df_nulos[cols_to_show].head(5))
