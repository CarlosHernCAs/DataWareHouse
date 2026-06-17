import re

filepath = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\sql_migrations\fase68_gold_marts_a_vistas.sql"

# Detect encoding
encodings = ['utf-16', 'utf-8', 'latin-1']
content = None
for enc in encodings:
    try:
        with open(filepath, 'r', encoding=enc) as f:
            content = f.read()
            print(f"Successfully read with encoding: {enc}")
            break
    except Exception as e:
        continue

if content:
    lines = content.splitlines()
    for idx, line in enumerate(lines):
        if 'avg(' in line.lower():
            print(f"Line {idx+1}: {line.strip()}")
else:
    print("Could not read file.")
