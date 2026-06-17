import os
from pathlib import Path

def find_files():
    root = Path("d:/Proyecto2026/ACP_DWH")
    print(f"Searching in: {root}")
    for path in root.rglob("*.xlsx"):
        # print path relative to root, and size
        size_mb = path.stat().st_size / (1024*1024)
        print(f"{path.relative_to(root)} | {size_mb:.2f} MB")

if __name__ == '__main__':
    find_files()
