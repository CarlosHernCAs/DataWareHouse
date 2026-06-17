import openpyxl
from collections import Counter
import re

file_path = r"C:\Users\chernandez\Desktop\2.- F-PYA.001 Presupuesto Campaña 2026 - 2027 Cultivo Arándano (29,370 t)_2025.11.13 ACP + QALI.xlsx"

def get_formula_type(formula):
    if not isinstance(formula, str) or not formula.startswith('='):
        return None
    # Extract function name (e.g. SUMIFS, VLOOKUP, INDEX, etc.)
    match = re.match(r'^=[+\s]*([A-Z0-9_]+)\b', formula)
    if match:
        return match.group(1)
    # Check if it is a simple reference (e.g., =+A1 or =A1)
    if re.match(r'^=[+\s]*[A-Z]+[0-9]+$', formula):
        return "REFERENCE"
    return "MATH/OTHER"

def summarize():
    print("Loading workbook...")
    wb = openpyxl.load_workbook(file_path, data_only=False)
    
    print("\n=== Workbook Summary ===")
    for name in wb.sheetnames:
        sheet = wb[name]
        print(f"\nSheet: {name}")
        print(f"Dimensions: {sheet.dimensions} | Max Row: {sheet.max_row} | Max Col: {sheet.max_column}")
        
        # Count cells with formulas vs values
        total_cells = 0
        formulas = []
        cell_types = Counter()
        
        # Sample first few rows for header detection
        headers = []
        for r in range(1, 15):
            row_vals = [sheet.cell(row=r, column=c).value for c in range(1, min(15, sheet.max_column + 1))]
            if any(v is not None for v in row_vals):
                headers.append((r, row_vals))
                
        # Analyze formulas in a sample of rows to avoid slow iteration on huge sheets
        formula_examples = {}
        for r in range(1, min(250, sheet.max_row + 1)):
            for c in range(1, min(100, sheet.max_column + 1)):
                val = sheet.cell(row=r, column=c).value
                if val is not None:
                    total_cells += 1
                    if isinstance(val, str) and val.startswith('='):
                        ftype = get_formula_type(val)
                        formulas.append((ftype, val))
                        col_letter = openpyxl.utils.get_column_letter(c)
                        if ftype not in formula_examples:
                            formula_examples[ftype] = []
                        if len(formula_examples[ftype]) < 3:
                            formula_examples[ftype].append((r, col_letter, val))
                            
        print(f"Sampled Cells: {total_cells} (in first 250 rows x 100 cols)")
        print(f"Formula Count in sample: {len(formulas)}")
        
        if formulas:
            ftypes = Counter(f[0] for f in formulas)
            print("Formula Types distribution in sample:")
            for ft, cnt in ftypes.most_common():
                print(f"  - {ft}: {cnt}")
            print("Formula Examples:")
            for ft, examples in formula_examples.items():
                print(f"  - Type {ft}:")
                for r, col, val in examples:
                    print(f"    * Cell {col}{r}: {val}")
        else:
            print("No formulas found in the sampled area.")
            
        print("Sample Headers / Row structure:")
        for r, row_vals in headers[:8]:
            row_str = " | ".join(str(v)[:30] if v is not None else "" for v in row_vals)
            print(f"  Row {r:02d}: {row_str}")
            
    wb.close()

if __name__ == "__main__":
    summarize()
