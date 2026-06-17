import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

print("=== Detalle de Bronce.Tasa_Crecimiento_Brotes para 2026-02-12 ===")
cursor.execute("""
    SELECT 
        Modulo_Raw, Turno_Raw, Valvula_Raw, Cama_Raw, Variedad_Raw,
        Tallo_Raw, Estado_Vegetativo_Raw, Planta_Brote_Raw, Cantidad_Raw, DNI_Raw
    FROM Bronce.Tasa_Crecimiento_Brotes
    WHERE Fecha_Raw = '2026-02-12 00:00:00'
    ORDER BY Modulo_Raw, Turno_Raw, Valvula_Raw, Cama_Raw, Planta_Brote_Raw
""")
for row in cursor.fetchall():
    print(f"Bronce: Mod={row[0]} Tur={row[1]} Val={row[2]} Cam={row[3]} Var={row[4]} | Tallo={row[5]} | Estado={row[6]} | Brote={row[7]} | Cant={row[8]} | DNI={row[9]}")

print("\n=== Detalle de Silver.Fact_Tasa_Crecimiento_Brotes para 2026-02-12 ===")
cursor.execute("""
    SELECT 
        m.Modulo, tu.Turno, va.Valvula, ca.Cama_Normalizada, v.Nombre_Variedad,
        f.Tipo_Tallo, f.Estado_Vegetativo, f.Planta_Brote, f.Cantidad, p.DNI
    FROM Silver.Fact_Tasa_Crecimiento_Brotes f
    JOIN Silver.Dim_Geografia g ON f.ID_Geografia = g.ID_Geografia
    LEFT JOIN Silver.Dim_Modulo_Catalogo m ON g.ID_Modulo_Catalogo = m.ID_Modulo_Catalogo
    LEFT JOIN Silver.Dim_Turno_Catalogo tu ON g.ID_Turno_Catalogo = tu.ID_Turno_Catalogo
    LEFT JOIN Silver.Dim_Valvula_Catalogo va ON g.ID_Valvula_Catalogo = va.ID_Valvula_Catalogo
    LEFT JOIN Silver.Dim_Cama_Catalogo ca ON g.ID_Cama_Catalogo = ca.ID_Cama_Catalogo
    JOIN Silver.Dim_Tiempo t ON f.ID_Tiempo = t.ID_Tiempo
    JOIN Silver.Dim_Variedad v ON f.ID_Variedad = v.ID_Variedad
    LEFT JOIN Silver.Dim_Personal p ON f.ID_Personal = p.ID_Personal
    WHERE t.Fecha = '2026-02-12'
    ORDER BY m.Modulo, tu.Turno, va.Valvula, ca.Cama_Normalizada, f.Planta_Brote
""")
for row in cursor.fetchall():
    print(f"Silver: Mod={row[0]} Tur={row[1]} Val={row[2]} Cam={row[3]} Var={row[4]} | Tallo={row[5]} | Estado={row[6]} | Brote={row[7]} | Cant={row[8]} | DNI={row[9]}")

c.close()
