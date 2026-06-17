import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("--- Comparing Bronce and Silver for 100% rows ---")
    query = text("""
        SELECT TOP 15
            b.ID_Induccion_Floral,
            b.PlantasPorCama_Raw,
            b.PlantasConInduccion_Raw,
            b.BrotesConInduccion_Raw,
            b.BrotesConFlor_Raw,
            s.Cantidad_Plantas_Por_Cama,
            s.Cantidad_Plantas_Con_Induccion,
            s.Pct_Plantas_Con_Induccion,
            b.Valores_Raw
        FROM Silver.Fact_Induccion_Floral s
        JOIN Bronce.Induccion_Floral b ON s.ID_Induccion_Floral = b.ID_Induccion_Floral
        WHERE s.Pct_Plantas_Con_Induccion = 100.0
    """)
    res = conn.execute(query).fetchall()
    for r in res:
        print(dict(r._mapping))
