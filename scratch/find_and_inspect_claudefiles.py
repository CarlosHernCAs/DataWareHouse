import os
from pathlib import Path
import pandas as pd

def find_and_inspect():
    root = Path("d:/Proyecto2026/ACP_DWH")
    print(f"Searching in: {root}")
    for dirpath, _, filenames in os.walk(root):
        # Exclude .git and .venv to be fast
        if ".git" in dirpath or ".venv" in dirpath:
            continue
        for f in filenames:
            if "vegetativa" in f.lower() and f.endswith(".xlsx"):
                path = Path(dirpath) / f
                # Let's see if this path is in worktrees or normal data
                size_mb = path.stat().st_size / (1024*1024)
                print(f"\n==========================================")
                print(f"Path: {path}")
                print(f"Size: {size_mb:.2f} MB")
                try:
                    xl = pd.ExcelFile(path)
                    print(f"Sheets: {xl.sheet_names}")
                    for sh in xl.sheet_names:
                        df = pd.read_excel(path, sheet_name=sh, usecols=[0])
                        print(f"  Sheet: {sh} | Total rows: {len(df) + 1}")
                except Exception as e:
                    print(f"Error: {e}")

if __name__ == '__main__':
    find_and_inspect()
