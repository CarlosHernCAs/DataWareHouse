import sys
import os
import re

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ETL')))

from config.conexion import obtener_engine
from sqlalchemy import text

def ejecutar_script_sql(ruta_sql):
    engine = obtener_engine()
    
    with open(ruta_sql, 'r', encoding='utf-8') as f:
        contenido = f.read()

    bloques = re.split(r'^\s*GO\s*$', contenido, flags=re.MULTILINE | re.IGNORECASE)
    
    with engine.connect().execution_options(isolation_level='AUTOCOMMIT') as conn:
        for i, bloque in enumerate(bloques):
            bloque_limpio = bloque.strip()
            if not bloque_limpio:
                continue
            
            print(f"--- Ejecutando bloque {i+1} ---")
            try:
                conn.execute(text(bloque_limpio))
                print("Ejecutado con éxito.")
            except Exception as e:
                print(f"Error al ejecutar bloque {i+1}: {e}")
                raise e

if __name__ == '__main__':
    ruta = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ETL', 'sql_migrations', 'fase65_fact_ciclos_fenologicos_color_cinta.sql'))
    ejecutar_script_sql(ruta)
