import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

geos = [4634, 6219, 33399]
for g in geos:
    print(f"\n=== ID_Geografia={g} ===")
    cursor.execute("""
        SELECT 
            ID_Geografia, ID_Tiempo, ID_Variedad, ID_Personal,
            Tipo_Tallo, Estado_Vegetativo, Planta_Brote, Cantidad, Fecha_Evento
        FROM Silver.Fact_Tasa_Crecimiento_Brotes
        WHERE ID_Geografia = ? AND CAST(Fecha_Evento AS DATE) = '2024-03-21'
    """, (g,))
    rows = cursor.fetchall()
    if not rows:
        print("  Sin filas en Silver.")
    for row in rows:
        print(f"  Geo={row[0]} Tiempo={row[1]} Var={row[2]} Per={row[3]} | Tallo={row[4]} | Estado={row[5]} | Brote={row[6]} | Cant={row[7]} | Fecha={row[8]}")

c.close()
