import pyodbc
import subprocess
import os

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
c.autocommit = True
c.execute("DELETE FROM Bronce.Evaluacion_Pesos")
c.execute("DELETE FROM Auditoria.Log_Carga WHERE Nombre_Archivo_Fuente LIKE '%Pesos%'")
c.execute("TRUNCATE TABLE Silver.Fact_Evaluacion_Pesos")
c.execute("TRUNCATE TABLE Gold.Mart_Pesos_Calibres")
c.close()

env = os.environ.copy()
subprocess.run(["d:/Proyecto2026/ACP_DWH/ACP Proyecciones/.venv/Scripts/python.exe", "d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/pipeline.py"], env=env)
