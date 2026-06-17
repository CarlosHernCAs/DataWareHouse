import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

geos = [288, 534, 304, 639]
for g in geos:
    cursor.execute("""
        SELECT 
            g.ID_Geografia, 
            m.Modulo, tu.Turno, va.Valvula, ca.Cama_Normalizada,
            g.Codigo_SAP_Campo, g.Nivel_Granularidad
        FROM Silver.Dim_Geografia g
        LEFT JOIN Silver.Dim_Modulo_Catalogo m ON g.ID_Modulo_Catalogo = m.ID_Modulo_Catalogo
        LEFT JOIN Silver.Dim_Turno_Catalogo tu ON g.ID_Turno_Catalogo = tu.ID_Turno_Catalogo
        LEFT JOIN Silver.Dim_Valvula_Catalogo va ON g.ID_Valvula_Catalogo = va.ID_Valvula_Catalogo
        LEFT JOIN Silver.Dim_Cama_Catalogo ca ON g.ID_Cama_Catalogo = ca.ID_Cama_Catalogo
        WHERE g.ID_Geografia = ?
    """, (g,))
    row = cursor.fetchone()
    print(f"ID={row[0]} | Mod={row[1]} Tur={row[2]} Val={row[3]} Cam={row[4]} | SAP={row[5]} | Nivel={row[6]}")

c.close()
