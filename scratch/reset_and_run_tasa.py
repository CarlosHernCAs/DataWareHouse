import pyodbc
import subprocess

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
c.autocommit = True
cursor = c.cursor()

print("Deleting from MDM.Cuarentena...")
cursor.execute("DELETE FROM MDM.Cuarentena WHERE Tabla_Origen IN ('Bronce.Tasa_Crecimiento_Brotes', 'Silver.Fact_Tasa_Crecimiento_Brotes')")

print("Truncating Gold.Mart_Tasa_Crecimiento...")
try:
    cursor.execute("TRUNCATE TABLE Gold.Mart_Tasa_Crecimiento")
except Exception as e:
    print(f"Truncate Gold failed, doing DELETE: {e}")
    cursor.execute("DELETE FROM Gold.Mart_Tasa_Crecimiento")

print("Truncating Silver.Fact_Tasa_Crecimiento_Brotes...")
try:
    cursor.execute("TRUNCATE TABLE Silver.Fact_Tasa_Crecimiento_Brotes")
except Exception as e:
    print(f"Truncate Silver failed, doing DELETE: {e}")
    cursor.execute("DELETE FROM Silver.Fact_Tasa_Crecimiento_Brotes")

print("Resetting Estado_Carga in Bronce.Tasa_Crecimiento_Brotes...")
cursor.execute("UPDATE Bronce.Tasa_Crecimiento_Brotes SET Estado_Carga = 'CARGADO'")

c.close()
print("Done resetting!")

print("Running pipeline...")
cmd = [".venv\\Scripts\\python.exe", "ETL\\pipeline.py", "--modo-ejecucion", "facts", "--facts", "Fact_Tasa_Crecimiento_Brotes"]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print("STDOUT:")
print(res.stdout)
print("STDERR:")
print(res.stderr)

