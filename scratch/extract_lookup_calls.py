import os
import re

facts_dir = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\silver\facts"
files = [f for f in os.listdir(facts_dir) if f.endswith(".py") and f.startswith("fact_") and f not in ("fact_fisiologia.py", "fact_induccion_floral.py")]

for filename in sorted(files):
    filepath = os.path.join(facts_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"=== File: {filename} ===")
    
    # Find lookup functions calls
    resolutions = []
    lines = content.splitlines()
    for idx, line in enumerate(lines):
        if '_validar_y_resolver_' in line or 'obtener_id_' in line:
            resolutions.append(f"Line {idx+1}: {line.strip()}")
            
    for res in resolutions[:8]:
        print(f"  {res}")
    print()
