import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ETL')))

from config.conexion import obtener_engine
from sqlalchemy import text

def inspect_color():
    engine = obtener_engine()
    
    with engine.connect() as conn:
        print("=== Conteo de Color_Raw y Organo_Raw en Bronce.Ciclos_Fenologicos ===")
        query_bronce = """
        SELECT 
            COUNT(*) as Total_Filas,
            SUM(CASE WHEN Color_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_Color_Raw,
            SUM(CASE WHEN Organo_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_Organo_Raw
        FROM Bronce.Ciclos_Fenologicos
        """
        res = conn.execute(text(query_bronce)).fetchone()
        if res:
            for k, v in res._mapping.items():
                print(f"{k}: {v}")
                
        print("\n=== Muestra de filas con Color_Raw no nulo en Bronce ===")
        query_muestra = "SELECT TOP 5 Color_Raw, Organo_Raw, Valores_Raw FROM Bronce.Ciclos_Fenologicos WHERE Color_Raw IS NOT NULL"
        res = conn.execute(text(query_muestra)).fetchall()
        for r in res:
            print(dict(r._mapping))
            
        print("\n=== Columnas físicas actuales de Silver.Fact_Ciclos_Fenologicos ===")
        query_cols = """
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'Silver' AND TABLE_NAME = 'Fact_Ciclos_Fenologicos'
        """
        res = conn.execute(text(query_cols)).fetchall()
        for r in res:
            print(f"{r[0]} ({r[1]}, nullable={r[2]})")

if __name__ == '__main__':
    inspect_color()
