import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ETL')))

from config.conexion import obtener_engine
from sqlalchemy import text

def inspect_bronce_rows():
    engine = obtener_engine()
    
    with engine.connect() as conn:
        print("=== Muestra de datos en Bronce para Ciclos Fenologicos.xlsx ===")
        query_sample = """
        SELECT TOP 3 * 
        FROM Bronce.Ciclos_Fenologicos 
        WHERE Nombre_Archivo = 'Ciclos Fenologicos.xlsx'
        """
        res = conn.execute(text(query_sample)).fetchall()
        for r in res:
            print(dict(r._mapping))
            
        print("\n=== Cantidad de valores no nulos por columna para Ciclos Fenologicos.xlsx ===")
        query_counts = """
        SELECT 
            COUNT(*) as Total,
            SUM(CASE WHEN Fecha_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_Fecha,
            SUM(CASE WHEN Modulo_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_Modulo,
            SUM(CASE WHEN Turno_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_Turno,
            SUM(CASE WHEN Valvula_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_Valvula,
            SUM(CASE WHEN Organo_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_Organo,
            SUM(CASE WHEN Color_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_Color,
            SUM(CASE WHEN Variedad_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_Variedad,
            SUM(CASE WHEN Evaluador_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_Evaluador,
            SUM(CASE WHEN FechaSubida_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_FechaSubida,
            SUM(CASE WHEN Valores_Raw IS NOT NULL THEN 1 ELSE 0 END) as Con_Valores
        FROM Bronce.Ciclos_Fenologicos
        WHERE Nombre_Archivo = 'Ciclos Fenologicos.xlsx'
        """
        res = conn.execute(text(query_counts)).fetchone()
        if res:
            for k, v in res._mapping.items():
                print(f"{k}: {v}")

if __name__ == '__main__':
    inspect_bronce_rows()
