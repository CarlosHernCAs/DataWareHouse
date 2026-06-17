import openpyxl
from pathlib import Path

def list_sheets():
    file_path = Path("d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/data/procesados/induccion_floral/Inducción Floral - Floración Campaña 2025_20260604_121652.xlsx")
    if not file_path.exists():
        print("File does not exist")
        return
    print(f"Reading sheet names of {file_path.name}...")
    wb = openpyxl.load_workbook(file_path, read_only=True)
    print("Sheets:", wb.sheetnames)
    wb.close()

if __name__ == '__main__':
    list_sheets()
