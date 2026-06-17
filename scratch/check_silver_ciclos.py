import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ETL'))
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("=== Distinct Fecha_Evento in Silver.Fact_Ciclos_Fenologicos ===")
    res = conn.execute(text("""
        SELECT CAST(Fecha_Evento AS DATE) as Fecha, COUNT(*) as cnt,
               SUM(CASE WHEN ID_Cinta IS NOT NULL THEN 1 ELSE 0 END) as Con_Cinta,
               SUM(CASE WHEN Organo IS NOT NULL THEN 1 ELSE 0 END) as Con_Organo
        FROM Silver.Fact_Ciclos_Fenologicos
        GROUP BY CAST(Fecha_Evento AS DATE)
        ORDER BY Fecha DESC
    """)).fetchall()
    for r in res:
        print(f"Fecha: {r[0]} | Rows: {r[1]} | Con_Cinta: {r[2]} | Con_Organo: {r[3]}")
