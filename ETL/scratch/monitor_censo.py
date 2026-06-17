import time
import sys
sys.path.insert(0, '.')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()

print("Iniciando monitoreo de la tabla Bronce.Censo_Plantas...")
last_count = 0
stable_iterations = 0

while True:
    try:
        with engine.connect() as con:
            current = con.execute(text('SELECT COUNT(*) FROM Bronce.Censo_Plantas')).scalar()
        
        if current > 0:
            if current == last_count:
                stable_iterations += 1
                # Si se mantiene estable por 3 iteraciones (15 segundos), asumimos que terminó
                if stable_iterations >= 3:
                    print(f"CARGA COMPLETADA: {current} registros estables en Bronce.")
                    break
            else:
                stable_iterations = 0
        
        last_count = current
        time.sleep(5)
    except Exception as e:
        print(f"Error consultando DB: {e}")
        time.sleep(5)
