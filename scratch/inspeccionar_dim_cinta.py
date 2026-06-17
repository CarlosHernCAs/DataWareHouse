import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ETL')))

from config.conexion import obtener_engine
from sqlalchemy import text

def inspect_cinta():
    engine = obtener_engine()
    
    with engine.connect() as conn:
        print("=== Contenido de Silver.Dim_Cinta ===")
        try:
            res = conn.execute(text("SELECT * FROM Silver.Dim_Cinta")).fetchall()
            for r in res:
                print(dict(r._mapping))
        except Exception as e:
            print(f"Error Dim_Cinta: {e}")
            
        print("\n=== Conteo de Fact_Maduracion ===")
        try:
            res = conn.execute(text("SELECT COUNT(*) FROM Silver.Fact_Maduracion")).scalar()
            print(f"Fact_Maduracion: {res} filas")
        except Exception as e:
            print(f"Error Fact_Maduracion: {e}")

if __name__ == '__main__':
    inspect_cinta()
