import openpyxl
from pathlib import Path

def inspect_resumen():
    file_path = Path("d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/data/procesados/induccion_floral/Inducción Floral - Floración Campaña 2025_20260604_121652.xlsx")
    if not file_path.exists():
        print("File does not exist")
        return
    print(f"Opening {file_path.name} in read-only formula mode...")
    wb = openpyxl.load_workbook(file_path, read_only=False, data_only=False)
    
    sheet = wb['Resumen']
    print(f"Reading first 40 rows of sheet 'Resumen'...")
    for r in range(1, 41):
        row_vals = [cell.value for cell in sheet[r]]
        if any(row_vals):
            # Print row index and cell values that are not None, showing formulas
            row_str = []
            for col_idx, val in enumerate(row_vals):
                if val is not None:
                    row_str.append(f"Col {col_idx+1}: {repr(val)}")
            print(f"Row {r}: {', '.join(row_str[:8])}")
            
    wb.close()

if __name__ == '__main__':
    inspect_resumen()
