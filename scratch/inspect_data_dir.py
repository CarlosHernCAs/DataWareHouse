import os
from pathlib import Path

def inspect_data():
    base = Path("d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/data")
    print(f"Walking: {base}")
    for root, dirs, files in os.walk(base):
        for f in files:
            path = Path(root) / f
            size_mb = path.stat().st_size / (1024*1024)
            # print relative to base
            rel = path.relative_to(base)
            print(f"{rel} | {size_mb:.2f} MB")

if __name__ == '__main__':
    inspect_data()
