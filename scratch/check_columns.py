import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("--- Columns of Silver.Fact_Induccion_Floral ---")
    res = conn.execute(text("""
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'Silver'
          AND TABLE_NAME = 'Fact_Induccion_Floral'
    """)).fetchall()
    for r in res:
        print(r[0])
