import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from config.conexion import obtener_engine
from silver.facts.fact_tasa_crecimiento_brotes import cargar_fact_tasa_crecimiento_brotes

def run():
    engine = obtener_engine()
    print("Running cargar_fact_tasa_crecimiento_brotes...")
    res = cargar_fact_tasa_crecimiento_brotes(engine)
    print("Result:", res)

if __name__ == '__main__':
    run()
