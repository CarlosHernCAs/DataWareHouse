import os
import shutil
import glob
from pathlib import Path

def restore_file():
    procesados_dir = Path("ETL/data/procesados/induccion_floral")
    entrada_dir = Path("ETL/data/entrada/induccion_floral")
    
    # Create entrada dir if it doesn't exist
    entrada_dir.mkdir(parents=True, exist_ok=True)
    
    # Look for the processed file
    files = list(procesados_dir.glob("Inducción Floral - Floración Campaña 2025_*.xlsx"))
    if not files:
        print("No processed file found to restore.")
        return
        
    latest_processed = max(files, key=os.path.getmtime)
    dest_path = entrada_dir / "Inducción Floral - Floración Campaña 2025.xlsx"
    
    print(f"Moving {latest_processed} to {dest_path}")
    shutil.move(str(latest_processed), str(dest_path))
    
    # Delete mark files
    mark_files = list(procesados_dir.glob("Inducción Floral - Floración Campaña 2025_*.json")) + \
                 list(entrada_dir.glob("Inducción Floral - Floración Campaña 2025*.json"))
                 
    for mf in mark_files:
        print(f"Deleting mark file: {mf}")
        try:
            os.remove(mf)
        except Exception as e:
            print(f"Error deleting: {e}")
            
    print("Restore completed successfully!")

if __name__ == '__main__':
    restore_file()
