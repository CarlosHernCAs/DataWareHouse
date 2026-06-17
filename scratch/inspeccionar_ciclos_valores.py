import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ETL')))

from config.conexion import obtener_engine
from sqlalchemy import text

def inspect_ciclos():
    engine = obtener_engine()
    
    with engine.connect() as conn:
        print("=== Valores Distintos de ID_Estado_Fenologico en Silver.Fact_Ciclos_Fenologicos ===")
        res = conn.execute(text("SELECT ID_Estado_Fenologico, COUNT(*) FROM Silver.Fact_Ciclos_Fenologicos GROUP BY ID_Estado_Fenologico")).fetchall()
        for r in res:
            print(f"{r[0]}: {r[1]}")
            
        print("\n=== Valores Distintos de Tipo_Evaluacion en Silver.Fact_Ciclos_Fenologicos ===")
        res = conn.execute(text("SELECT Tipo_Evaluacion, COUNT(*) FROM Silver.Fact_Ciclos_Fenologicos GROUP BY Tipo_Evaluacion")).fetchall()
        for r in res:
            print(f"{r[0]}: {r[1]}")
            
        print("\n=== Cantidad de valores no nulos en Cantidad, Dia y Evaluador ===")
        query = """
        SELECT 
            COUNT(*) as Total,
            SUM(CASE WHEN Cantidad IS NOT NULL THEN 1 ELSE 0 END) as Con_Cantidad,
            SUM(CASE WHEN Dia IS NOT NULL THEN 1 ELSE 0 END) as Con_Dia,
            SUM(CASE WHEN Evaluador IS NOT NULL THEN 1 ELSE 0 END) as Con_Evaluador,
            SUM(CASE WHEN Cama IS NOT NULL THEN 1 ELSE 0 END) as Con_Cama
        FROM Silver.Fact_Ciclos_Fenologicos
        """
        res = conn.execute(text(query)).fetchone()
        if res:
            for k, v in res._mapping.items():
                print(f"{k}: {v}")

        print("\n=== Valores Distintos de Categoria y Tipo_Evaluacion en Bronce.Ciclos_Fenologicos (Valores_Raw) ===")
        query_val = "SELECT TOP 10 Valores_Raw FROM Bronce.Ciclos_Fenologicos WHERE Valores_Raw IS NOT NULL"
        res = conn.execute(text(query_val)).fetchall()
        for r in res:
            print(r[0])

if __name__ == '__main__':
    inspect_ciclos()
