import pyodbc
c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
c.autocommit = True
cursor = c.cursor()

print("Deleting from MDM.Cuarentena...")
cursor.execute("DELETE FROM MDM.Cuarentena WHERE Tabla_Origen = 'Bronce.Induccion_Floral'")

print("Truncating Gold.Mart_Induccion_Floral...")
try:
    cursor.execute("TRUNCATE TABLE Gold.Mart_Induccion_Floral")
except Exception as e:
    print(f"Truncate failed, doing DELETE: {e}")
    cursor.execute("DELETE FROM Gold.Mart_Induccion_Floral")

print("Truncating Silver.Fact_Induccion_Floral...")
try:
    cursor.execute("TRUNCATE TABLE Silver.Fact_Induccion_Floral")
except Exception as e:
    print(f"Truncate failed, doing DELETE: {e}")
    cursor.execute("DELETE FROM Silver.Fact_Induccion_Floral")

print("Resetting Estado_Carga in Bronce.Induccion_Floral...")
cursor.execute("UPDATE Bronce.Induccion_Floral SET Estado_Carga = 'CARGADO'")

print("Verification:")
cursor.execute("SELECT COUNT(*) FROM Silver.Fact_Induccion_Floral")
print(f"Silver count: {cursor.fetchone()[0]}")
cursor.execute("SELECT COUNT(*) FROM Gold.Mart_Induccion_Floral")
print(f"Gold count: {cursor.fetchone()[0]}")
cursor.execute("SELECT Estado_Carga, COUNT(*) FROM Bronce.Induccion_Floral GROUP BY Estado_Carga")
for r in cursor.fetchall():
    print(f"Bronce status {r[0]}: {r[1]}")

c.close()
print("Done reset!")
