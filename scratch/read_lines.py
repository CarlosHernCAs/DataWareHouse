file_path = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\graphify-out\graph.html"
with open(file_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if i >= 75 and i <= 140:
            print(f"{i}: {line.rstrip()}")
