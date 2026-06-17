import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("--- Searching for matching Bronce row ---")
    query = text("""
        SELECT *
        FROM Bronce.Induccion_Floral
        WHERE BrotesConInduccion_Raw = '932'
           OR PlantasConInduccion_Raw = '715'
    """)
    res = conn.execute(query).fetchall()
    for r in res:
        print(dict(r._mapping))
