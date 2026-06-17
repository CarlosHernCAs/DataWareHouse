file_path = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\graphify-out\graph.html"
with open(file_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "physics-panel" in line or "btn-reorganize" in line:
            # Clean non-ascii for safe console print
            clean_line = line.encode('ascii', errors='replace').decode('ascii')
            print(f"{i}: {clean_line.strip()[:150]}")
