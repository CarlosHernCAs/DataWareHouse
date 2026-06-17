import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ETL'))
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.begin() as conn:
    res = conn.execute(text("UPDATE Bronce.Ciclos_Fenologicos SET Estado_Carga = 'CARGADO' WHERE Nombre_Archivo LIKE 'Ciclos_Fenologicos%'"))
    print(f'Filas actualizadas: {res.rowcount}')
