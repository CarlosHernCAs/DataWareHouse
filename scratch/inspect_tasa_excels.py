"""
inspect_tasa_excels.py
======================
Analiza la estructura, hojas y cantidad de filas reales de los 3 archivos Excel de Tasa.
"""
import os
import openpyxl
from pathlib import Path
import pandas as pd

base_dir = Path(r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data\procesados\tasa_crecimiento_brotes")

def inspect_file(filename):
    path = base_dir / filename
    if not path.exists():
        # Intentar en la carpeta de entrada si no está en procesados
        path = Path(r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data\entrada\tasa_crecimiento_brotes") / filename
        if not path.exists():
            print(f"Archivo no encontrado: {filename}")
            return
            
    print(f"\n==========================================")
    print(f"Inspeccionando: {filename}")
    print(f"Tamaño: {path.stat().st_size / 1024 / 1024:.2f} MB")
    
    with pd.ExcelFile(str(path)) as xls:
        print("Hojas disponibles:", xls.sheet_names)
        for sheet in xls.sheet_names:
            # Leer las primeras filas de forma liviana
            df = pd.read_excel(xls, sheet_name=sheet, nrows=5)
            print(f"\nHoja: '{sheet}'")
            print(f"Columnas detectadas en primeras filas: {list(df.columns)}")
            
            # Contar filas totales de forma eficiente
            df_full = pd.read_excel(xls, sheet_name=sheet, usecols=[0])
            print(f"Filas totales (incluyendo cabeceras): {len(df_full) + 1}")

if __name__ == '__main__':
    # Buscar todos los excels en la carpeta de procesados/tasa_crecimiento_brotes
    for f in base_dir.glob("*.xlsx"):
        inspect_file(f.name)
