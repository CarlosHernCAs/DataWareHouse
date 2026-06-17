import pyodbc
import time
import subprocess
import sys

def main():
    c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
    c.autocommit = True
    cursor = c.cursor()

    print("=== RESETTING DATABASE FOR TESTING ===")
    
    # 1. Fisiologia
    print("Resetting Fisiologia...")
    cursor.execute("DELETE FROM MDM.Cuarentena WHERE Tabla_Origen = 'Bronce.Fisiologia'")
    try:
        cursor.execute("TRUNCATE TABLE Silver.Fact_Fisiologia")
    except Exception:
        cursor.execute("DELETE FROM Silver.Fact_Fisiologia")
    cursor.execute("UPDATE Bronce.Fisiologia SET Estado_Carga = 'CARGADO'")
    
    # 2. Inducción Floral
    print("Resetting Induccion Floral...")
    cursor.execute("DELETE FROM MDM.Cuarentena WHERE Tabla_Origen = 'Bronce.Induccion_Floral'")
    try:
        cursor.execute("TRUNCATE TABLE Silver.Fact_Induccion_Floral")
    except Exception:
        cursor.execute("DELETE FROM Silver.Fact_Induccion_Floral")
    cursor.execute("UPDATE Bronce.Induccion_Floral SET Estado_Carga = 'CARGADO'")
    
    print("Done resetting database.")
    c.close()

    # Run the pipeline
    print("\n=== RUNNING PIPELINE WITH REFACTORED FACTS ===")
    start_time = time.time()
    result = subprocess.run([
        r"d:/Proyecto2026/ACP_DWH/ACP Proyecciones/.venv/Scripts/python.exe",
        r"d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/pipeline.py",
        "--modo-ejecucion", "facts",
        "--facts", "Fact_Fisiologia,Fact_Induccion_Floral"
    ], capture_output=True, text=True)
    
    end_time = time.time()
    
    print("\n=== PIPELINE OUTPUT ===")
    print(result.stdout)
    if result.stderr:
        print("=== PIPELINE ERRORS ===")
        print(result.stderr)
        
    print(f"\nPipeline execution took: {end_time - start_time:.2f} seconds")
    
    # Verification
    print("\n=== VERIFYING COUNTS ===")
    c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
    cursor = c.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM Silver.Fact_Fisiologia")
    count_fis = cursor.fetchone()[0]
    print(f"Silver.Fact_Fisiologia loaded rows: {count_fis}")
    
    cursor.execute("SELECT COUNT(*) FROM Silver.Fact_Induccion_Floral")
    count_ind = cursor.fetchone()[0]
    print(f"Silver.Fact_Induccion_Floral loaded rows: {count_ind}")
    
    cursor.execute("SELECT COUNT(*) FROM MDM.Cuarentena WHERE Tabla_Origen = 'Bronce.Fisiologia'")
    cuar_fis = cursor.fetchone()[0]
    print(f"Cuarentena.Fisiologia rows: {cuar_fis}")
    
    cursor.execute("SELECT COUNT(*) FROM MDM.Cuarentena WHERE Tabla_Origen = 'Bronce.Induccion_Floral'")
    cuar_ind = cursor.fetchone()[0]
    print(f"Cuarentena.Induccion_Floral rows: {cuar_ind}")
    
    c.close()

if __name__ == '__main__':
    main()
