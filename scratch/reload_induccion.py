import sys
import os
import shutil
import re
from pathlib import Path
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()

# 1. Truncate/Clear database tables and quarantine logs
with engine.begin() as conn:
    print("Truncating/Deleting Silver.Fact_Induccion_Floral...")
    try:
        conn.execute(text("TRUNCATE TABLE Silver.Fact_Induccion_Floral"))
    except Exception as e:
        print(f"  Truncate Silver failed, doing delete: {e}")
        conn.execute(text("DELETE FROM Silver.Fact_Induccion_Floral"))

    print("Truncating/Deleting Bronce.Induccion_Floral...")
    try:
        conn.execute(text("TRUNCATE TABLE Bronce.Induccion_Floral"))
    except Exception as e:
        print(f"  Truncate Bronze failed, doing delete: {e}")
        conn.execute(text("DELETE FROM Bronce.Induccion_Floral"))

    print("Deleting from MDM.Cuarentena...")
    conn.execute(text("DELETE FROM MDM.Cuarentena WHERE Tabla_Origen = 'Bronce.Induccion_Floral'"))

# 2. Locate and move all processed Excels back to entrada
procesados_dir = Path("ETL/data/procesados/induccion_floral")
entrada_dir = Path("ETL/data/entrada/induccion_floral")
entrada_dir.mkdir(parents=True, exist_ok=True)

excels = list(procesados_dir.glob("*.xlsx"))
print(f"Found {len(excels)} files in procesados:")
for e in excels:
    stem = e.stem
    # Remove any timestamp added by the archiver to restore original name
    clean_stem = re.sub(r'_\d{8}_\d{6}$', '', stem)
    dest_name = f"{clean_stem}{e.suffix}"
    dest_path = entrada_dir / dest_name
    
    print(f"  Moving {e} -> {dest_path}")
    shutil.move(str(e), str(dest_path))

# 3. Delete all .procesado.json files
print("Cleaning .procesado.json tracking files...")
count_json = 0
for p in Path("ETL/data").rglob("*.procesado.json"):
    p_name_lower = p.name.lower()
    if "induccion" in p_name_lower or "floral" in p_name_lower:
        print(f"  Deleting: {p}")
        p.unlink()
        count_json += 1
print(f"Deleted {count_json} tracking files.")

print("\nReset and preparation for reload complete!")
