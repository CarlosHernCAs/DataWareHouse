import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from config.conexion import obtener_engine
from sqlalchemy import text

def check():
    engine = obtener_engine()
    with engine.connect() as conn:
        tables = conn.execute(text("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Bronce'
        """)).fetchall()
        for t in tables:
            name = t[0]
            try:
                states = conn.execute(text(f"SELECT Estado_Carga, COUNT(*) FROM Bronce.{name} GROUP BY Estado_Carga")).fetchall()
                print(f"{name}: {states}")
            except Exception as e:
                print(f"Error checking {name}: {e}")

if __name__ == '__main__':
    check()
