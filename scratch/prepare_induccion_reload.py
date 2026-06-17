import sys
from pathlib import Path
import shutil
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()

# 1. Truncar tablas
with engine.begin() as conn:
    print("Truncando Bronce.Induccion_Floral...")
    conn.execute(text("TRUNCATE TABLE Bronce.Induccion_Floral"))
    print("Truncando Silver.Fact_Induccion_Floral...")
    conn.execute(text("TRUNCATE TABLE Silver.Fact_Induccion_Floral"))
    print("Limpiando logs de cuarentena previos para Bronce.Induccion_Floral...")
    conn.execute(text("DELETE FROM MDM.Cuarentena WHERE Tabla_Origen = 'Bronce.Induccion_Floral'"))

# 2. Buscar archivo en procesados
procesados_dir = Path("ETL/data/procesados/induccion_floral")
archivos = sorted(
    procesados_dir.glob("*Inducción Floral - Floración Campaña 2025*.xlsx"),
    key=lambda p: p.stat().st_mtime,
    reverse=True
)

destino_dir = Path("ETL/data/entrada/induccion_floral")
destino_dir.mkdir(parents=True, exist_ok=True)
destino = destino_dir / "Inducción Floral - Floración Campaña 2025.xlsx"

if archivos:
    origen = archivos[0]
    print(f"Moviendo {origen} -> {destino}")
    shutil.move(str(origen), str(destino))
else:
    print("Advertencia: No se encontró ningún archivo coincidente en procesados.")

# Eliminar marcas de procesamiento
for p in Path("ETL/data").rglob("*.procesado.json"):
    if "Inducción Floral - Floración Campaña 2025" in p.name:
        print(f"Eliminando marca de proceso: {p}")
        p.unlink()

print("Preparación completada exitosamente.")
