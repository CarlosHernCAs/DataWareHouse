import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

print("=== Fechas en Bronce.Tasa_Crecimiento_Brotes ===")
cursor.execute("SELECT MIN(Fecha_Raw), MAX(Fecha_Raw), COUNT(*) FROM Bronce.Tasa_Crecimiento_Brotes")
row = cursor.fetchone()
print(f"Bronce: Min={row[0]} Max={row[1]} Total={row[2]}")

print("\n=== Fechas en Silver.Fact_Tasa_Crecimiento_Brotes ===")
cursor.execute("SELECT MIN(Fecha_Evento), MAX(Fecha_Evento), COUNT(*) FROM Silver.Fact_Tasa_Crecimiento_Brotes")
row = cursor.fetchone()
print(f"Silver: Min={row[0]} Max={row[1]} Total={row[2]}")

print("\n=== ¿Hay registros en Cuarentena de Tasa_Crecimiento_Brotes? ===")
cursor.execute("SELECT Motivo, COUNT(*) FROM MDM.Cuarentena WHERE Tabla_Origen = 'Bronce.Tasa_Crecimiento_Brotes' GROUP BY Motivo")
for row in cursor.fetchall():
    print(f"  Motivo: {row[0]} | Filas: {row[1]}")

c.close()
