"""
restaurar_tasa_only.py
======================
Trunca Bronce.Tasa_Crecimiento_Brotes, limpia las tablas Silver y Gold de Tasa,
y copia los Excels correctos de procesados/tasa_crecimiento_brotes hacia entrada/tasa_crecimiento_brotes
sin los timestamps del pipeline para permitir una recarga limpia y completa.
"""
import os
import re
import shutil
import pyodbc
from pathlib import Path

CONN_STR = 'DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;'

def restaurar_y_limpiar():
    # 1. Rutas
    base_dir = Path(r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data")
    procesados_dir = base_dir / "procesados" / "tasa_crecimiento_brotes"
    entrada_dir = base_dir / "entrada" / "tasa_crecimiento_brotes"
    
    # Asegurar que entrada existe y está vacía
    if entrada_dir.exists():
        for item in entrada_dir.iterdir():
            if item.is_file():
                try:
                    item.unlink()
                except Exception as e:
                    print(f"No se pudo eliminar {item.name}: {e}")
    else:
        entrada_dir.mkdir(parents=True, exist_ok=True)
    
    print("=== RESTAURANDO ARCHIVOS EXCEL DE TASA ===")
    
    # Patrón para identificar timestamps del cargador: _YYYYMMDD_HHMMSS
    patron_timestamp = re.compile(r'_\d{8}_\d{6}$')
    
    archivos_por_base = {}
    for f in procesados_dir.iterdir():
        if not f.is_file() or f.suffix.lower() != '.xlsx':
            continue
        
        # Limpiar nombre para quitar el timestamp de procesado
        stem = f.stem
        while True:
            match = patron_timestamp.search(stem)
            if match:
                stem = stem[:match.start()]
            else:
                break
        
        nombre_base = f"{stem}{f.suffix}"
        
        # Guardamos el archivo y nos quedamos con el que tenga la fecha de modificación más reciente
        if nombre_base not in archivos_por_base:
            archivos_por_base[nombre_base] = f
        else:
            if f.stat().st_mtime > archivos_por_base[nombre_base].stat().st_mtime:
                archivos_por_base[nombre_base] = f
                
    for nombre_base, ruta_origen in archivos_por_base.items():
        dest_file = entrada_dir / nombre_base
        shutil.copy2(ruta_origen, dest_file)
        print(f"  [COPIADO] {ruta_origen.name} -> {nombre_base} ({ruta_origen.stat().st_size / 1024:.1f} KB)")
        
    # 2. Limpiar Base de Datos
    print("\n=== LIMPIANDO BASE DE DATOS (TASA SOLAMENTE) ===")
    conn = pyodbc.connect(CONN_STR, autocommit=True)
    cursor = conn.cursor()
    
    print("  Borrando Bronce.Tasa_Crecimiento_Brotes...")
    cursor.execute("TRUNCATE TABLE Bronce.Tasa_Crecimiento_Brotes")
    
    print("  Borrando Silver.Fact_Tasa_Crecimiento_Brotes...")
    cursor.execute("TRUNCATE TABLE Silver.Fact_Tasa_Crecimiento_Brotes")
    
    print("  Borrando Gold.Mart_Tasa_Crecimiento...")
    cursor.execute("TRUNCATE TABLE Gold.Mart_Tasa_Crecimiento")
    
    print("  Limpiando cuarentena de Tasa Crecimiento...")
    cursor.execute("DELETE FROM MDM.Cuarentena WHERE Tabla_Origen IN ('Bronce.Tasa_Crecimiento_Brotes', 'Silver.Fact_Tasa_Crecimiento_Brotes')")
    
    conn.close()
    print("\nLimpieza y restauración completada con éxito. Ya puedes correr el pipeline completo.")

if __name__ == '__main__':
    restaurar_y_limpiar()
