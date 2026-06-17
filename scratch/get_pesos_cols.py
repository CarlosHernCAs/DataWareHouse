import pyodbc
c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()
cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Bronce' AND TABLE_NAME = 'Evaluacion_Pesos'")
print("Columnas en Bronce.Evaluacion_Pesos:")
for row in cursor.fetchall():
    print(row[0])
c.close()
