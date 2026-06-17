import pyodbc
import pandas as pd

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')

print("--- CUARENTENA POR TABLA ORIGEN ---")
df_cuar = pd.read_sql("SELECT Tabla_Origen, COUNT(*) as Rechazados FROM MDM.Cuarentena GROUP BY Tabla_Origen ORDER BY Rechazados DESC", c)
print(df_cuar.to_string(index=False))

print("\n--- FILAS EN SILVER ---")
tablas_silver = pd.read_sql("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'Silver' AND TABLE_NAME LIKE 'Fact_%'", c)
for tabla in tablas_silver['TABLE_NAME']:
    count = pd.read_sql(f"SELECT COUNT(*) as count FROM Silver.{tabla}", c).iloc[0]['count']
    print(f"Silver.{tabla}: {count}")

c.close()
