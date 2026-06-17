import openpyxl
from pathlib import Path

file_path = r"C:\Users\chernandez\Desktop\2.- F-PYA.001 Presupuesto Campaña 2026 - 2027 Cultivo Arándano (29,370 t)_2025.11.13 ACP + QALI.xlsx"

print(f"Checking if file exists: {Path(file_path).exists()}")

try:
    # load without data_only to see formulas
    wb = openpyxl.load_workbook(file_path, read_only=True, keep_vba=False)
    print("Sheets in workbook:")
    for sheet_name in wb.sheetnames:
        print(f" - {sheet_name}")
    wb.close()
except Exception as e:
    print(f"Error reading workbook: {e}")
