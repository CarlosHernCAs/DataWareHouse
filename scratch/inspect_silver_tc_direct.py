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
geos = cursor.fetchall()
print(f"Geografias encontradas: {geos}")

if geos:
    id_geo = geos[0][0]
    print(f"\n=== Consultando Silver.Fact_Tasa_Crecimiento_Brotes para ID_Geografia={id_geo} ===")
    cursor.execute("""
        SELECT 
            ID_Geografia, ID_Tiempo, ID_Variedad, ID_Personal,
            Tipo_Tallo, Estado_Vegetativo, Planta_Brote, Cantidad, Fecha_Evento
        FROM Silver.Fact_Tasa_Crecimiento_Brotes
        WHERE ID_Geografia = ? AND CAST(Fecha_Evento AS DATE) = '2024-03-21'
    """, (id_geo,))
    for row in cursor.fetchall():
        print(f"Geo={row[0]} Tiempo={row[1]} Var={row[2]} Per={row[3]} | Tallo={row[4]} | Estado={row[5]} | Brote={row[6]} | Cant={row[7]} | Fecha={row[8]}")

print("\n=== Consultando Bronce para la misma combinacion ===")
cursor.execute("""
    SELECT 
        Modulo_Raw, Turno_Raw, Valvula_Raw, Cama_Raw, Fecha_Raw,
        Tallo_Raw, Estado_Vegetativo_Raw, Planta_Brote_Raw, Cantidad_Raw, Valores_Raw
    FROM Bronce.Tasa_Crecimiento_Brotes
    WHERE Modulo_Raw = '6' AND Turno_Raw = '4' AND Valvula_Raw = '2' AND Cama_Raw = '63'
      AND Fecha_Raw = '2024-03-21 00:00:00'
      AND Planta_Brote_Raw = 'P3B1'
""")
for row in cursor.fetchall():
    print(f"Mod={row[0]} Tur={row[1]} Val={row[2]} Cam={row[3]} | Fecha={row[4]} | Tallo={row[5]} | Estado={row[6]} | Brote={row[7]} | Cant={row[8]}")
    print(f"  Valores_Raw={row[9]}")

c.close()
