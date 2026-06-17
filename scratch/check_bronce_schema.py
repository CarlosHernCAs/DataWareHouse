import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ETL'))
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    res = conn.execute(text("""
        SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'Bronce' AND TABLE_NAME = 'Ciclos_Fenologicos'
        ORDER BY ORDINAL_POSITION
    """)).fetchall()
    print('=== Columnas Bronce.Ciclos_Fenologicos ===')
    for r in res:
        print(f"{r[0]} ({r[1]})")

    print('\n=== Rows Count ===')
    cnt = conn.execute(text("SELECT COUNT(*) FROM Bronce.Ciclos_Fenologicos")).scalar()
    print("Total Rows:", cnt)
