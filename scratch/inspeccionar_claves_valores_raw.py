import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ETL')))

from config.conexion import obtener_engine
from sqlalchemy import text

def inspect_keys():
    engine = obtener_engine()
    
    with engine.connect() as conn:
        res = conn.execute(text("SELECT Valores_Raw FROM Bronce.Ciclos_Fenologicos WHERE Valores_Raw IS NOT NULL")).fetchall()
        keys = set()
        for r in res:
            valores_raw = r[0]
            for token in valores_raw.split('|'):
                token = token.strip()
                if '=' in token:
                    clave = token.partition('=')[0].strip()
                    keys.add(clave)
        print("=== Claves encontradas en Valores_Raw de Bronce.Ciclos_Fenologicos ===")
        for k in sorted(keys):
            print(k)

if __name__ == '__main__':
    inspect_keys()
