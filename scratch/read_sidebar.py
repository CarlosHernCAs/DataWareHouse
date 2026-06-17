file_path = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\graphify-out\graph.html"
with open(file_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if i >= 35 and i <= 78:
            if len(line) > 500:
                print(f"{i}: [Line too long: {len(line)} chars]")
            else:
                print(f"{i}: {line.rstrip()}")
