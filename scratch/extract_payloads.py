import os
import re

facts_dir = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\silver\facts"
files = [f for f in os.listdir(facts_dir) if f.endswith(".py") and f.startswith("fact_") and f not in ("fact_fisiologia.py", "fact_induccion_floral.py")]

for filename in sorted(files):
    filepath = os.path.join(facts_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"=== File: {filename} ===")
    
    # Extract _construir_payload method
    match = re.search(r"def _construir_payload\(self, df: pd.DataFrame\).*?(?=def |class |$)", content, re.DOTALL)
    if match:
        payload_lines = match.group(0).splitlines()
        # Print first 35 lines of the method
        for line in payload_lines[:35]:
            print(f"  {line}")
        if len(payload_lines) > 35:
            print("  ...")
    else:
        print("  _construir_payload not found or named differently")
    print()
