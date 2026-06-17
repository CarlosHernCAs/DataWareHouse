import pyodbc
import os

conn = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;', autocommit=True)
c = conn.cursor()
c.execute("UPDATE Bronce.Tasa_Crecimiento_Brotes SET Estado_Carga = 'CARGADO'")
conn.close()
print('Actualizado a CARGADO. Ejecutando pipeline...')
os.system('python ETL/pipeline.py --modo-ejecucion facts --facts Fact_Tasa_Crecimiento_Brotes')
