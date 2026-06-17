import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

print("=== Consultando Silver.Fact_Tasa_Crecimiento_Brotes para Fecha_Evento = '2024-03-21' ===")
cursor.execute("""
    SELECT 
        f.ID_Geografia, f.ID_Tiempo, f.ID_Variedad, f.ID_Personal,
        f.Tipo_Tallo, f.Estado_Vegetativo, f.Planta_Brote, f.Cantidad
    FROM Silver.Fact_Tasa_Crecimiento_Brotes f
    WHERE CAST(f.Fecha_Evento AS DATE) = '2024-03-21'
""")
rows = cursor.fetchall()
print(f"Filas en Silver en esa fecha: {len(rows)}")
for row in rows[:5]:
    print(f"  Geo={row[0]} Tiempo={row[1]} Var={row[2]} Per={row[3]} | Tallo={row[4]} | Estado={row[5]} | Brote={row[6]} | Cant={row[7]}")

c.close()
