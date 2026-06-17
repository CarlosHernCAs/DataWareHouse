import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

print("=== Consultando Silver.vFact_Tasa_Crecimiento_Brotes para una combinacion ===")
cursor.execute("""
    SELECT 
        Modulo, Turno, Valvula, Cama,
        Fecha_Evento,
        Tipo_Tallo, Estado_Vegetativo, Planta_Brote, Cantidad
    FROM Silver.vFact_Tasa_Crecimiento_Brotes
    WHERE Modulo = 6 AND Turno = 4 AND Valvula = 2 AND Cama = '63'
      AND CAST(Fecha_Evento AS DATE) = '2024-03-21'
""")
for row in cursor.fetchall():
    print(f"Mod={row[0]} Tur={row[1]} Val={row[2]} Cam={row[3]} | Fecha={row[4]} | Tallo={row[5]} | Estado={row[6]} | Brote={row[7]} | Cant={row[8]}")

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
