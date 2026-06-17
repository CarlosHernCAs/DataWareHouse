import openpyxl
import re
from pathlib import Path

file_path = r"C:\Users\chernandez\Desktop\2.- F-PYA.001 Presupuesto Campaña 2026 - 2027 Cultivo Arándano (29,370 t)_2025.11.13 ACP + QALI.xlsx"
output_file = Path("scratch/budget_formulas_analysis.txt")

def normalizar_formula(formula, row_num):
    """
    Normaliza una fórmula reemplazando referencias a la fila actual
    con '{row}' para poder agruparlas.
    Por ejemplo, '=A5*B5' en la fila 5 se convierte en '=A{row}*B{row}'.
    """
    if not isinstance(formula, str) or not formula.startswith('='):
        return formula
    # Reemplazar números de fila que coincidan con row_num por {row}
    # Asegurándose de no reemplazar números en cadenas o nombres de hojas si no es necesario.
    # Expresión regular simple para buscar letras de columnas seguidas por el número de fila.
    pattern = rf'\b([A-Z]+){row_num}\b'
    return re.sub(pattern, r'\1{row}', formula)

def analizar():
    print("Abriendo archivo Excel...")
    wb = openpyxl.load_workbook(file_path, data_only=False)
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("============================================================\n")
        f.write("ANALISIS QUIRURGICO DEL EXCEL DE PRESUPUESTO\n")
        f.write("============================================================\n\n")
        
        for name in wb.sheetnames:
            sheet = wb[name]
            f.write(f"------------------------------------------------------------\n")
            f.write(f"PESTAÑA: {name}\n")
            f.write(f"Dimensiones: {sheet.dimensions}\n")
            f.write(f"------------------------------------------------------------\n")
            
            # Leer primeras 15 filas completas para entender la estructura de cabecera
            f.write("--- Cabecera (Primeras 15 filas) ---\n")
            max_r = min(15, sheet.max_row)
            max_c = min(15, sheet.max_column)
            
            for r in range(1, max_r + 1):
                row_vals = []
                for c in range(1, max_c + 1):
                    val = sheet.cell(row=r, column=c).value
                    # Si es fórmula, mostrar la fórmula acortada
                    if isinstance(val, str) and val.startswith('='):
                        row_vals.append(f"Fórmula: {val[:30]}")
                    else:
                        row_vals.append(str(val) if val is not None else "")
                if any(row_vals):
                    f.write(f"Fila {r:02d}: {row_vals}\n")
            
            # Buscar y agrupar fórmulas en toda la pestaña
            f.write("\n--- Mapeo de Fórmulas ---\n")
            formulas_por_columna = {}  # col_letter -> {norm_formula: [filas]}
            
            for r in range(1, sheet.max_row + 1):
                for c in range(1, sheet.max_column + 1):
                    cell = sheet.cell(row=r, column=c)
                    val = cell.value
                    if isinstance(val, str) and val.startswith('='):
                        col_letter = openpyxl.utils.get_column_letter(c)
                        norm = normalizar_formula(val, r)
                        
                        if col_letter not in formulas_por_columna:
                            formulas_por_columna[col_letter] = {}
                        if norm not in formulas_por_columna[col_letter]:
                            formulas_por_columna[col_letter][norm] = []
                        formulas_por_columna[col_letter][norm].append(r)
            
            if not formulas_por_columna:
                f.write("No se encontraron celdas con fórmulas en esta pestaña.\n")
            else:
                for col, formulas in sorted(formulas_por_columna.items()):
                    f.write(f"Columna {col}:\n")
                    for norm, filas in formulas.items():
                        # Mostrar rango de filas o lista de filas
                        if len(filas) > 5:
                            rango_filas = f"Filas {filas[0]} a {filas[-1]} (Total {len(filas)} filas)"
                        else:
                            rango_filas = f"Filas: {filas}"
                        f.write(f"  - {rango_filas}\n")
                        f.write(f"    Fórmula Normalizada: {norm}\n")
                        # Mostrar un ejemplo real en la primera fila donde aparece
                        real_val = sheet.cell(row=filas[0], column=openpyxl.utils.column_index_from_string(col)).value
                        f.write(f"    Ejemplo real (Fila {filas[0]}): {real_val}\n")
            f.write("\n\n")
            
    wb.close()
    print("Análisis guardado en scratch/budget_formulas_analysis.txt")

if __name__ == "__main__":
    analizar()
