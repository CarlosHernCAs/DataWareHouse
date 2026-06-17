import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("--- All columns of Bronce.Induccion_Floral for ID = 48 ---")
    row = conn.execute(text("SELECT * FROM Bronce.Induccion_Floral WHERE ID_Induccion_Floral = 48")).fetchone()
    if row:
        print(dict(row._mapping))
    else:
        print("Not found")
