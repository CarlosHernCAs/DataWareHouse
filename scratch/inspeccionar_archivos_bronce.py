import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ETL')))

from config.conexion import obtener_engine
from sqlalchemy import text

def inspect_files():
    engine = obtener_engine()
    
    with engine.connect() as conn:
        print("=== Conteo de filas en Bronce.Ciclos_Fenologicos por Nombre_Archivo ===")
        query = """
        SELECT Nombre_Archivo, COUNT(*) as Filas,
               SUM(CASE WHEN Color_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_Color_Raw
        FROM Bronce.Ciclos_Fenologicos
        GROUP BY Nombre_Archivo
        """
        res = conn.execute(text(query)).fetchall()
        for r in res:
            print(f"Archivo: {r[0]} | Filas: {r[1]} | Con_Color_Raw: {r[2]}")

if __name__ == '__main__':
    inspect_files()
