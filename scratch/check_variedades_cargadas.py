import sys
import os

# Add ETL to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../ETL")))

from config.conexion import obtener_engine
from sqlalchemy import text

def check_loaded_varieties():
    engine = obtener_engine()
    query = text("""
        SELECT v.Nombre_Variedad, COUNT(*) as Total_Registros
        FROM Silver.Fact_Conteo_Fenologico f
        JOIN Silver.Dim_Variedad v ON f.ID_Variedad = v.ID_Variedad
        WHERE v.Nombre_Variedad IN ('RAYMI', 'FLORIDA MAGNUS', 'SWEEP CREEP')
        GROUP BY v.Nombre_Variedad
    """)
    
    with engine.connect() as conn:
        result = conn.execute(query).fetchall()
        print("=== Registros Cargados por Variedad ===")
        if not result:
            print("No se encontraron registros para las nuevas variedades en Silver.Fact_Conteo_Fenologico.")
        for r in result:
            print(f"  Variedad: {r[0]:<20} | Registros: {r[1]}")
            
    # Let's also check if there are quarantined ones left
    quarantine_query = text("""
        SELECT Variedad_Raw, COUNT(*) as Total
        FROM Bronce.Conteo_Fruta
        WHERE Estado_Carga = 'CUARENTENA' AND (
            Variedad_Raw LIKE '%RAYMI%' OR 
            Variedad_Raw LIKE '%FLORIDA%' OR 
            Variedad_Raw LIKE '%SWEEP%' OR
            Variedad_Raw LIKE '%MAGNUS%'
        )
        GROUP BY Variedad_Raw
    """)
    
    # Check Gold view
    gold_query = text("""
        SELECT Variedad, COUNT(*) as Total_Registros
        FROM Gold.Mart_Fenologia
        WHERE Variedad IN ('RAYMI', 'FLORIDA MAGNUS', 'SWEEP CREEP')
        GROUP BY Variedad
    """)
    
    with engine.connect() as conn:
        g_result = conn.execute(gold_query).fetchall()
        print("\n=== Registros en Gold.Mart_Fenologia ===")
        if not g_result:
            print("No se encontraron registros para las nuevas variedades en Gold.Mart_Fenologia.")
        for r in g_result:
            print(f"  Variedad (Gold): {r[0]:<20} | Registros: {r[1]}")
            
        # Print sample rows
        sample_query = text("""
            SELECT TOP 5 * 
            FROM Gold.Mart_Fenologia
            WHERE Variedad IN ('RAYMI', 'FLORIDA MAGNUS', 'SWEEP CREEP')
        """)
        samples = conn.execute(sample_query)
        print("\n=== Muestra de Filas en Gold.Mart_Fenologia ===")
        columns = samples.keys()
        for s in samples:
            print({c: val for c, val in zip(columns, s)})
    
    with engine.connect() as conn:
        q_result = conn.execute(quarantine_query).fetchall()
        print("\n=== Registros en Cuarentena (Bronce) ===")
        if not q_result:
            print("No quedan registros de estas variedades en CUARENTENA.")
        for r in q_result:
            print(f"  Variedad Raw: {r[0]:<20} | Registros: {r[1]}")

if __name__ == '__main__':
    check_loaded_varieties()
