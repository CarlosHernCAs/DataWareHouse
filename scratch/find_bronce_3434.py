import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("--- Searching for Bronce row matching Silver row 3434 metrics ---")
    
    # First get the details of Silver row 3434
    silver_row = conn.execute(text("""
        SELECT * FROM Silver.Fact_Induccion_Floral WHERE ID_Induccion_Floral = 3434
    """)).fetchone()
    print("Silver Row 3434:")
    print(dict(silver_row._mapping))
    
    # Now query Bronce for matches
    print("\nMatching Bronce Rows:")
    query = text("""
        SELECT *
        FROM Bronce.Induccion_Floral
        WHERE (PlantasPorCama_Raw = '75' AND PlantasConInduccion_Raw = '171')
           OR (PlantasPorCama_Raw = '75' AND BrotesConInduccion_Raw = '171')
           OR (BrotesConInduccion_Raw = '171')
    """)
    res = conn.execute(query).fetchall()
    for r in res:
        print(dict(r._mapping))
