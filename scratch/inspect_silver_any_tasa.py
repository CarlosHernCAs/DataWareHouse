import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

print("=== Conteo de filas en Silver.Fact_Tasa_Crecimiento_Brotes por Fecha ===")
cursor.execute("""
    SELECT TOP 10 CAST(Fecha_Evento AS DATE) as Fecha, COUNT(*)
    FROM Silver.Fact_Tasa_Crecimiento_Brotes
    GROUP BY CAST(Fecha_Evento AS DATE)
    ORDER BY Fecha DESC
""")
for row in cursor.fetchall():
    print(f"  Fecha={row[0]} | Filas={row[1]}")

print("\n=== Conteo de filas en Bronce.Tasa_Crecimiento_Brotes por Fecha ===")
cursor.execute("""
    SELECT TOP 10 Fecha_Raw, COUNT(*)
    FROM Bronce.Tasa_Crecimiento_Brotes
    GROUP BY Fecha_Raw
    ORDER BY Fecha_Raw DESC
""")
for row in cursor.fetchall():
    print(f"  Fecha_Raw={row[0]} | Filas={row[1]}")

c.close()
