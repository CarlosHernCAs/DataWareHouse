import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ETL'))
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    res = conn.execute(text("SELECT * FROM Silver.Dim_Cinta")).fetchall()
    print("=== Silver.Dim_Cinta ===")
    for r in res:
        print(dict(r._mapping))
