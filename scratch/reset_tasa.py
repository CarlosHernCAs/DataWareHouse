import pyodbc
import os

conn = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;', autocommit=True)
c = conn.cursor()

print('Limpiando Gold...')
c.execute('TRUNCATE TABLE Gold.Mart_Tasa_Crecimiento')
print('Limpiando Silver...')
c.execute('TRUNCATE TABLE Silver.Fact_Tasa_Crecimiento_Brotes')
print('Reiniciando Bronce...')
c.execute("UPDATE Bronce.Tasa_Crecimiento_Brotes SET Estado_Carga = 'NO_CARGADO'")
print('Limpieza terminada. Iniciando pipeline...')

conn.close()

os.system('python ETL/pipeline.py --modo-ejecucion facts --facts Fact_Tasa_Crecimiento_Brotes')
