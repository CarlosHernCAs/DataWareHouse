import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("--- Rows where Pct_Plantas_Con_Induccion > 100 ---")
    query = text("""
        SELECT TOP 15
            s.ID_Induccion_Floral,
            s.Cantidad_Plantas_Por_Cama,
            s.Cantidad_Plantas_Con_Induccion,
            s.Pct_Plantas_Con_Induccion,
            b.PlantasPorCama_Raw,
            b.PlantasConInduccion_Raw,
            b.Nombre_Archivo,
            b.Valores_Raw
        FROM Silver.Fact_Induccion_Floral s
        JOIN Bronce.Induccion_Floral b ON s.ID_Induccion_Floral = b.ID_Induccion_Floral
        WHERE s.Pct_Plantas_Con_Induccion > 100.0
    """)
    res = conn.execute(query).fetchall()
    for r in res:
        print(dict(r._mapping))
