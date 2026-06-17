import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ETL')))

from config.conexion import obtener_engine
from sqlalchemy import text

def inspect_db():
    engine = obtener_engine()
    
    with engine.connect() as conn:
        print("=== Conteo de Tablas ===")
        for tabla in [
            'Bronce.Ciclos_Fenologicos',
            'Silver.Fact_Ciclos_Fenologicos',
            'Silver.Fact_Conteo_Fenologico',
            'Gold.Mart_Fenologia'
        ]:
            try:
                cnt = conn.execute(text(f"SELECT COUNT(*) FROM {tabla}")).scalar()
                print(f"{tabla}: {cnt} filas")
            except Exception as e:
                print(f"Error contando {tabla}: {e}")
                
        print("\n=== Schema y Datos Muestra de Silver.Fact_Ciclos_Fenologicos ===")
        try:
            res = conn.execute(text("SELECT TOP 5 * FROM Silver.Fact_Ciclos_Fenologicos")).fetchall()
            for r in res:
                print(dict(r._mapping))
        except Exception as e:
            print(f"Error: {e}")
            
        print("\n=== Schema y Datos Muestra de Gold.Mart_Fenologia ===")
        try:
            res = conn.execute(text("SELECT TOP 5 * FROM Gold.Mart_Fenologia")).fetchall()
            for r in res:
                print(dict(r._mapping))
        except Exception as e:
            print(f"Error: {e}")
            
        print("\n=== Columnas vacías o nulas en Gold.Mart_Fenologia ===")
        try:
            # Conteo de nulos por columna
            query = """
            SELECT 
                COUNT(*) as Total_Filas,
                SUM(CASE WHEN Color_Cinta IS NULL THEN 1 ELSE 0 END) as Nulos_Color_Cinta,
                SUM(CASE WHEN Cantidad_Bayas IS NULL THEN 1 ELSE 0 END) as Nulos_Cantidad_Bayas,
                SUM(CASE WHEN Pct_Cosechable IS NULL THEN 1 ELSE 0 END) as Nulos_Pct_Cosechable,
                SUM(CASE WHEN Pct_Avance_Ciclo IS NULL THEN 1 ELSE 0 END) as Nulos_Pct_Avance_Ciclo,
                SUM(CASE WHEN Brotes_Productivos IS NULL THEN 1 ELSE 0 END) as Nulos_Brotes_Productivos,
                SUM(CASE WHEN Brotes_Vegetativos IS NULL THEN 1 ELSE 0 END) as Nulos_Brotes_Vegetativos,
                SUM(CASE WHEN Ratio_Productivo_Veg IS NULL THEN 1 ELSE 0 END) as Nulos_Ratio_Productivo_Veg
            FROM Gold.Mart_Fenologia
            """
            res = conn.execute(text(query)).fetchone()
            if res:
                for k, v in res._mapping.items():
                    print(f"{k}: {v}")
        except Exception as e:
            print(f"Error al analizar nulos: {e}")

if __name__ == '__main__':
    inspect_db()
