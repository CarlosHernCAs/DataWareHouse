import re

filepath = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\bronce\cargador.py"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.splitlines()
for idx, line in enumerate(lines):
    if 'induccion' in line.lower():
        print(f"Line {idx+1}: {line.strip()}")
