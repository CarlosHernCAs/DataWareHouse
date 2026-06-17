import pyodbc

conn = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;', autocommit=True)
c = conn.cursor()
c.execute("SELECT TOP 5 Valores_Raw, Planta_Brote_Raw, Cantidad_Raw, Tallo_Raw FROM Bronce.Tasa_Crecimiento_Brotes WHERE Estado_Carga = 'PROCESADO'")
for r in c.fetchall():
    print(r)
