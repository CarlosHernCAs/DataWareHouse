import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from config.conexion import obtener_engine
from sqlalchemy import text

def check():
    engine = obtener_engine()
    with engine.connect() as conn:
        for table in ['Fact_Floracion', 'Fact_Tasa_Crecimiento_Brotes', 'Fact_Censo_Plantas', 'Fact_Areas_Plantas']:
            print(f"\n--- Schema of Silver.{table} ---")
            cols = conn.execute(text(f"""
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'Silver' AND TABLE_NAME = '{table}'
            """)).fetchall()
            for col in cols:
                print(col)

if __name__ == '__main__':
    check()
