import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

print("=== Comprobando duplicados en Bronce.Tasa_Crecimiento_Brotes ===")
# Buscar si hay filas con misma clave de pre_limpiar_duplicados_batch pero distinto DNI_Raw, Tallo_Raw o Estado_Vegetativo_Raw
cursor.execute("""
    WITH Claves AS (
        SELECT 
            Modulo_Raw, Turno_Raw, Valvula_Raw, Cama_Raw, Fecha_Raw, Variedad_Raw, Planta_Brote_Raw
        FROM Bronce.Tasa_Crecimiento_Brotes
        GROUP BY Modulo_Raw, Turno_Raw, Valvula_Raw, Cama_Raw, Fecha_Raw, Variedad_Raw, Planta_Brote_Raw
        HAVING COUNT(*) > 1
    )
    SELECT TOP 10 
        b.Modulo_Raw, b.Turno_Raw, b.Valvula_Raw, b.Cama_Raw, b.Fecha_Raw, b.Variedad_Raw, b.Planta_Brote_Raw,
        COUNT(DISTINCT b.DNI_Raw) as dist_dni,
        COUNT(DISTINCT b.Tallo_Raw) as dist_tallo,
        COUNT(DISTINCT b.Estado_Vegetativo_Raw) as dist_estado,
        COUNT(*) as total_filas
    FROM Bronce.Tasa_Crecimiento_Brotes b
    INNER JOIN Claves c ON 
        b.Modulo_Raw = c.Modulo_Raw AND 
        b.Turno_Raw = c.Turno_Raw AND 
        b.Valvula_Raw = c.Valvula_Raw AND 
        b.Cama_Raw = c.Cama_Raw AND 
        b.Fecha_Raw = c.Fecha_Raw AND 
        b.Variedad_Raw = c.Variedad_Raw AND 
        b.Planta_Brote_Raw = c.Planta_Brote_Raw
    GROUP BY b.Modulo_Raw, b.Turno_Raw, b.Valvula_Raw, b.Cama_Raw, b.Fecha_Raw, b.Variedad_Raw, b.Planta_Brote_Raw
    ORDER BY total_filas DESC
""")

rows = cursor.fetchall()
if not rows:
    print("No se encontraron filas con claves coincidentes en Bronce.")
else:
    for row in rows:
        print(f"Clave: Mod={row[0]} Tur={row[1]} Val={row[2]} Cam={row[3]} Fecha={row[4]} Var={row[5]} Brote={row[6]}")
        print(f"  Distintos DNI: {row[7]} | Distintos Tallo: {row[8]} | Distintos Estado: {row[9]} | Total Filas: {row[10]}")

c.close()
