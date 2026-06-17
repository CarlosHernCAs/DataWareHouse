import pyodbc
c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cur = c.cursor()
cur.execute("SELECT COUNT(*) FROM Bronce.Evaluacion_Pesos")
count = cur.fetchone()[0]
print(f"Filas actuales en Bronce.Evaluacion_Pesos: {count}")
