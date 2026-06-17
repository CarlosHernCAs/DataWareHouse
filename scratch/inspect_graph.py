import os

file_path = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\graphify-out\graph.html"
with open(file_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if len(line) > 10000:
            print(f"Line {i} is too long ({len(line)} chars). Skipping print.")
            continue
        
        # Search for interesting keywords
        keywords = ["script", "network", "vis", "options", "physics", "container", "sidebar"]
        found = [kw for kw in keywords if kw in line.lower()]
        if found:
            print(f"Line {i}: {line.strip()[:150]}... (Matched keywords: {found})")
