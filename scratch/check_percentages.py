import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("--- Stats for Silver.Fact_Induccion_Floral ---")
    res = conn.execute(text("""
        SELECT 
            COUNT(*) as Total,
            SUM(CASE WHEN Pct_Plantas_Con_Induccion = 100.0 THEN 1 ELSE 0 END) as Plantas_100,
            SUM(CASE WHEN Pct_Plantas_Con_Induccion = 0.0 THEN 1 ELSE 0 END) as Plantas_0,
            SUM(CASE WHEN Pct_Plantas_Con_Induccion > 0 AND Pct_Plantas_Con_Induccion < 100 THEN 1 ELSE 0 END) as Plantas_Between,
            SUM(CASE WHEN Pct_Brotes_Con_Induccion = 100.0 THEN 1 ELSE 0 END) as BrotesInd_100,
            SUM(CASE WHEN Pct_Brotes_Con_Induccion = 0.0 THEN 1 ELSE 0 END) as BrotesInd_0,
            SUM(CASE WHEN Pct_Brotes_Con_Induccion > 0 AND Pct_Brotes_Con_Induccion < 100 THEN 1 ELSE 0 END) as BrotesInd_Between,
            SUM(CASE WHEN Pct_Brotes_Con_Flor = 100.0 THEN 1 ELSE 0 END) as BrotesFlor_100,
            SUM(CASE WHEN Pct_Brotes_Con_Flor = 0.0 THEN 1 ELSE 0 END) as BrotesFlor_0,
            SUM(CASE WHEN Pct_Brotes_Con_Flor > 0 AND Pct_Brotes_Con_Flor < 100 THEN 1 ELSE 0 END) as BrotesFlor_Between
        FROM Silver.Fact_Induccion_Floral
    """)).fetchone()
    print(dict(res._mapping) if res else "No data")

    print("\n--- Sample rows from Silver.Fact_Induccion_Floral ---")
    rows = conn.execute(text("""
        SELECT TOP 10 
            Cantidad_Plantas_Por_Cama, Cantidad_Plantas_Con_Induccion, Pct_Plantas_Con_Induccion,
            Cantidad_Brotes_Totales, Cantidad_Brotes_Con_Induccion, Pct_Brotes_Con_Induccion,
            Cantidad_Brotes_Con_Flor, Pct_Brotes_Con_Flor
        FROM Silver.Fact_Induccion_Floral
    """)).fetchall()
    for r in rows:
        print(dict(r._mapping))

    print("\n--- Sample rows from Bronce.Induccion_Floral ---")
    bronce_rows = conn.execute(text("""
        SELECT TOP 10
            PlantasPorCama_Raw, PlantasConInduccion_Raw, BrotesConInduccion_Raw, BrotesConFlor_Raw, Valores_Raw
        FROM Bronce.Induccion_Floral
    """)).fetchall()
    for r in bronce_rows:
        print(dict(r._mapping))
