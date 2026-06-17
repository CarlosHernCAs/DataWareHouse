import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text
from pathlib import Path
import shutil

engine = obtener_engine()

# 1. Eliminar registros corruptos en Bronce
print("=== Limpiando registros corruptos de Bronce ===")
with engine.connect() as conn:
    with conn.begin():
        # Primero ver cuántos hay
        q_count = text("SELECT COUNT(1) FROM Bronce.Induccion_Floral WHERE Nombre_Archivo = 'Reporte Inducción Floral.xlsx'")
        total = conn.execute(q_count).scalar()
        print(f"Registros encontrados en Bronce con Nombre_Archivo 'Reporte Inducción Floral.xlsx': {total}")
        
        if total > 0:
            q_delete = text("DELETE FROM Bronce.Induccion_Floral WHERE Nombre_Archivo = 'Reporte Inducción Floral.xlsx'")
            res = conn.execute(q_delete)
            print(f"Registros eliminados con éxito: {res.rowcount}")
        else:
            print("No se encontraron registros para eliminar.")

# 2. Mover archivo Excel de vuelta a entrada
print("\n=== Restaurando archivo Excel ===")
archivo_procesado = Path("ETL/data/procesados/induccion_floral/Reporte Inducción Floral_20260608_161905.xlsx")
archivo_entrada = Path("ETL/data/entrada/induccion_floral/Reporte Inducción Floral.xlsx")

if archivo_procesado.exists():
    # Asegurar que el directorio destino exista
    archivo_entrada.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(archivo_procesado), str(archivo_entrada))
    print(f"Archivo movido de '{archivo_procesado}' a '{archivo_entrada}'")
else:
    print(f"El archivo procesado '{archivo_procesado}' no existe. ¿Ya fue movido?")
