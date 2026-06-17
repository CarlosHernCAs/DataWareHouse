import os
from pathlib import Path
import json

def check_json():
    root = Path("d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/data")
    for p in root.rglob("*.json"):
        if "procesado" in p.name or "rechazado" in p.name:
            print(f"File: {p.relative_to(root.parent.parent)}")
            try:
                with open(p, "r", encoding="utf-8") as f:
                    print(json.load(f))
            except Exception as e:
                print(f"Error reading: {e}")

if __name__ == "__main__":
    check_json()
