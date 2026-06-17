import os
import pandas as pd
from pathlib import Path

def inspect_file():
    filepath = Path(r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data\procesados\evaluacion_vegetativa\historico_vegetativa_20260603_162617.xlsx")
    print(f"File path: {filepath}")
    if not filepath.exists():
        print("File does not exist!")
        return
    
    # Check size
    print(f"Size: {filepath.stat().st_size / (1024*1024):.2f} MB")
    
    # Read sheet names
    try:
        xl = pd.ExcelFile(filepath)
        print(f"Sheets: {xl.sheet_names}")
        for sheet in xl.sheet_names:
            # Read only first column or shape to be fast
            df = pd.read_excel(filepath, sheet_name=sheet, usecols=[0])
            print(f"Sheet: {sheet} | Total Rows in Excel: {len(df) + 1}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    inspect_file()
