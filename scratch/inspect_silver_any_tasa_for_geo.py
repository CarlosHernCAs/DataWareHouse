import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

# Find ID_Geografia
cursor.execute("""
    SELECT g.ID_Geografia
    FROM Silver.Dim_Geografia g
    LEFT JOIN Silver.Dim_Modulo_Catalogo m ON g.ID_Modulo_Catalogo = m.ID_Modulo_Catalogo
    LEFT JOIN Silver.Dim_Turno_Catalogo t ON g.ID_Turno_Catalogo = t.ID_Turno_Catalogo
    LEFT JOIN Silver.Dim_Valvula_Catalogo v ON g.ID_Valvula_Catalogo = v.ID_Valvula_Catalogo
    LEFT JOIN Silver.Dim_Cama_Catalogo ca ON g.ID_Cama_Catalogo = ca.ID_Cama_Catalogo
    WHERE m.Modulo = 6 AND t.Turno = 4 AND v.Valvula = 2 AND ca.Cama_Normalizada = '63'
""")
geos = [row[0] for row in cursor.fetchall()]
print(f"Geografias: {geos}")

if geos:
    # Query count in Silver grouped by date
    cursor.execute(f"""
        SELECT CAST(Fecha_Evento AS DATE) as Fecha, COUNT(*)
        FROM Silver.Fact_Tasa_Crecimiento_Brotes
        WHERE ID_Geografia IN ({','.join(map(str, geos))})
        GROUP BY CAST(Fecha_Evento AS DATE)
        ORDER BY Fecha DESC
    """)
    print("\n=== Filas en Silver por fecha ===")
    for row in cursor.fetchall():
        print(f"  Fecha: {row[0]} | Filas: {row[1]}")

# Query count in Bronce grouped by date
cursor.execute("""
    SELECT Fecha_Raw, COUNT(*)
    FROM Bronce.Tasa_Crecimiento_Brotes
    WHERE Modulo_Raw = '6' AND Turno_Raw = '4' AND Valvula_Raw = '2' AND Cama_Raw = '63'
    GROUP BY Fecha_Raw
    ORDER BY Fecha_Raw DESC
""")
print("\n=== Filas en Bronce por fecha ===")
for row in cursor.fetchall():
    print(f"  Fecha_Raw: {row[0]} | Filas: {row[1]}")

c.close()
