import pyodbc
c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()
cursor.execute("SELECT Estado_Carga, COUNT(*) FROM Bronce.Evaluacion_Pesos GROUP BY Estado_Carga")
print("Bronce.Evaluacion_Pesos:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")
c.close()
