import os
from pathlib import Path

def find_files():
    root = Path("d:/Proyecto2026/ACP_DWH/ACP Proyecciones")
    for p in root.rglob("*Ciclos*"):
        print(p.relative_to(root))

if __name__ == "__main__":
    find_files()
