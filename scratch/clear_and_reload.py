import pyodbc
import subprocess

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
c.autocommit = True
cursor = c.cursor()

print("1. Clearing MDM.Cuarentena...")
cursor.execute("DELETE FROM MDM.Cuarentena")

print("2. Truncating Silver Fact tables...")
for table in ["Silver.Fact_Induccion_Floral", "Silver.Fact_Tasa_Crecimiento_Brotes"]:
    try:
        cursor.execute(f"TRUNCATE TABLE {table}")
        print(f"  Truncated {table}")
    except Exception as e:
        print(f"  Truncate failed for {table}, doing DELETE: {e}")
        cursor.execute(f"DELETE FROM {table}")

print("3. Truncating Gold Mart tables...")
for table in ["Gold.Mart_Induccion_Floral", "Gold.Mart_Tasa_Crecimiento"]:
    try:
        cursor.execute(f"TRUNCATE TABLE {table}")
        print(f"  Truncated {table}")
    except Exception as e:
        print(f"  Truncate failed for {table}, doing DELETE: {e}")
        cursor.execute(f"DELETE FROM {table}")

print("4. Resetting Bronce load status...")
cursor.execute("UPDATE Bronce.Induccion_Floral SET Estado_Carga = 'CARGADO'")
print("  Reset Bronce.Induccion_Floral status.")
cursor.execute("UPDATE Bronce.Tasa_Crecimiento_Brotes SET Estado_Carga = 'CARGADO'")
print("  Reset Bronce.Tasa_Crecimiento_Brotes status.")

c.close()
print("Reset complete! Now running pipeline...")

cmd = [".venv\\Scripts\\python.exe", "ETL\\pipeline.py", "--modo-ejecucion", "facts", "--facts", "Fact_Induccion_Floral,Fact_Tasa_Crecimiento_Brotes"]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

print("\n--- PIPELINE EXECUTION RESULT ---")
print("STDOUT:")
print(res.stdout)
print("STDERR:")
print(res.stderr)
