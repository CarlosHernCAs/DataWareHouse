import pyodbc
c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cur = c.cursor()
cur.execute("SELECT COUNT(*) FROM Bronce.Evaluacion_Pesos WHERE Estado_Carga='CARGADO' AND PesoCosechables_Raw IS NOT NULL AND TRY_CAST(PesoCosechables_Raw AS FLOAT) > 0")
print("Rows with PesoCosechables_Raw > 0:", cur.fetchone()[0])
cur.execute("SELECT COUNT(*) FROM Bronce.Evaluacion_Pesos WHERE Estado_Carga='CARGADO'")
print("Total rows CARGADO:", cur.fetchone()[0])
