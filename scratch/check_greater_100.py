import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("--- Stats for Silver.Fact_Induccion_Floral including > 100 ---")
    res = conn.execute(text("""
        SELECT 
            COUNT(*) as Total,
            SUM(CASE WHEN Pct_Plantas_Con_Induccion = 100.0 THEN 1 ELSE 0 END) as Plantas_100,
            SUM(CASE WHEN Pct_Plantas_Con_Induccion = 0.0 THEN 1 ELSE 0 END) as Plantas_0,
            SUM(CASE WHEN Pct_Plantas_Con_Induccion > 0 AND Pct_Plantas_Con_Induccion < 100 THEN 1 ELSE 0 END) as Plantas_Between,
            SUM(CASE WHEN Pct_Plantas_Con_Induccion > 100 THEN 1 ELSE 0 END) as Plantas_Greater_100,
            SUM(CASE WHEN Pct_Plantas_Con_Induccion IS NULL THEN 1 ELSE 0 END) as Plantas_Null
        FROM Silver.Fact_Induccion_Floral
    """)).fetchone()
    print(dict(res._mapping) if res else "No data")
