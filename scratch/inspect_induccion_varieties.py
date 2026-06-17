import sys
import os

# Add ETL to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../ETL")))

from config.conexion import obtener_engine
from sqlalchemy import text

def inspect_induccion_varieties():
    engine = obtener_engine()
    
    # Fetch sample Valores_Raw from Bronce.Induccion_Floral
    q = text("""
        SELECT TOP 10 Valores_Raw, Nombre_Archivo
        FROM Bronce.Induccion_Floral
    """)
    
    with engine.connect() as conn:
        res = conn.execute(q).fetchall()
        print("=== Muestras de Valores_Raw ===")
        for i, r in enumerate(res):
            print(f"Row {i+1} | Archivo: {r[1]} | Valores_Raw: {r[0]}")

if __name__ == '__main__':
    inspect_induccion_varieties()


