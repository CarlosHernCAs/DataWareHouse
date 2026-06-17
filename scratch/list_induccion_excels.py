import os
from pathlib import Path

def list_excels():
    root = Path("d:/Proyecto2026/ACP_DWH/ACP Proyecciones")
    for p in root.rglob("*.xlsx"):
        if ".claude" in p.parts:
            continue
        print(f"File: {p} | Size: {p.stat().st_size / 1024:.2f} KB")

if __name__ == '__main__':
    list_excels()
