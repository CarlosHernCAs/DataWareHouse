import openpyxl
from pathlib import Path

def inspect_excel():
    dir_path = Path("d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/data/procesados/induccion_floral")
    
    # Try finding files
    files = list(dir_path.glob("*.xlsx"))
    
    for file in files:
        if file.stat().st_size > 5 * 1024 * 1024:
            print(f"Skipping large file: {file.name}")
            continue
            
        print(f"Opening: {file.name}")
        try:
            wb = openpyxl.load_workbook(file, read_only=False, data_only=False)
            sheet = wb.active
            print(f"Active Sheet: {sheet.title}")
            
            # Print headers (row 1 or 2 or 3)
            for r in range(1, 4):
                row_vals = [cell.value for cell in sheet[r]]
                if any(row_vals):
                    print(f"Row {r}: {row_vals[:15]}")
                    
            # Let's search for formulas in first 100 rows
            found = 0
            for r in range(1, 100):
                row_cells = sheet[r]
                row_formulas = [(col_idx + 1, cell.value) for col_idx, cell in enumerate(row_cells) if isinstance(cell.value, str) and cell.value.startswith("=")]
                if row_formulas:
                    print(f"Row {r} formulas: {row_formulas}")
                    found += 1
                    if found > 5:
                        break
            
            wb.close()
        except Exception as e:
            print(f"Error reading {file.name}: {e}")

if __name__ == '__main__':
    inspect_excel()
