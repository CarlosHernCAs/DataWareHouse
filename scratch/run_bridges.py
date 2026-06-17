import sys, os
sys.path.insert(0, os.path.abspath('ETL'))
from config.conexion import obtener_engine
from pipeline import _sincronizar_bridges_geografia

engine = obtener_engine()
print("Ejecutando _sincronizar_bridges_geografia...")
_sincronizar_bridges_geografia(engine)
print("Bridges sincronizados exitosamente.")
