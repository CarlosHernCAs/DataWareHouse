import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("--- Stats on 100% Plantas Con Induccion ---")
    res = conn.execute(text("""
        SELECT TOP 30
            Cantidad_Plantas_Por_Cama, 
            Cantidad_Plantas_Con_Induccion,
            Cantidad_Brotes_Totales,
            Cantidad_Brotes_Con_Induccion,
            Cantidad_Brotes_Con_Flor,
            Pct_Plantas_Con_Induccion
        FROM Silver.Fact_Induccion_Floral
        WHERE Pct_Plantas_Con_Induccion = 100.0
    """)).fetchall()
    for r in res:
        print(dict(r._mapping))

    print("\n--- Distribution of 100% where Plantas_Por_Cama = Plantas_Con_Induccion ---")
    counts = conn.execute(text("""
        SELECT 
            COUNT(*) as Total_100,
            SUM(CASE WHEN Cantidad_Plantas_Por_Cama = 1 THEN 1 ELSE 0 END) as Por_Cama_1,
            SUM(CASE WHEN Cantidad_Plantas_Por_Cama = Cantidad_Plantas_Con_Induccion THEN 1 ELSE 0 END) as Por_Cama_Equal_Con_Ind,
            SUM(CASE WHEN Cantidad_Plantas_Por_Cama = 0 THEN 1 ELSE 0 END) as Por_Cama_0
        FROM Silver.Fact_Induccion_Floral
        WHERE Pct_Plantas_Con_Induccion = 100.0
    """)).fetchone()
    print(dict(counts._mapping))
