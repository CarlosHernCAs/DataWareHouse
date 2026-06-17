import pyodbc
c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cur = c.cursor()
cur.execute("SELECT TOP 5 Tabla_Destino, Filas_Leidas, Filas_Insertadas, Filas_Rechazadas, Filas_Cuarentena, Fecha_Inicio FROM Auditoria.Log_Carga ORDER BY ID_Log_Carga DESC")
rows = cur.fetchall()
print("Recent Log_Carga entries:")
for r in rows:
    print(r)
