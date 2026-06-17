import os
from pathlib import Path

def find_files():
    # search d:\Proyecto2026 recursively
    root = Path("d:/Proyecto2026")
    print(f"Searching in: {root}")
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            if "vegetativa" in f.lower() or "vegetativo" in f.lower():
                path = Path(dirpath) / f
                size_mb = path.stat().st_size / (1024*1024)
                print(f"{path} | {size_mb:.2f} MB")

if __name__ == '__main__':
    find_files()
