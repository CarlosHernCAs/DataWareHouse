import pyodbc
import subprocess

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
c.autocommit = True
c.execute("DELETE FROM Bronce.Evaluacion_Pesos")
c.execute("DELETE FROM Auditoria.Log_Carga WHERE Nombre_Archivo_Fuente LIKE '%Pesos%'")
c.execute("TRUNCATE TABLE Silver.Fact_Evaluacion_Pesos")
c.execute("TRUNCATE TABLE Gold.Mart_Pesos_Calibres")

subprocess.run(["powershell", "-Command", "New-Item -ItemType Directory -Force -Path 'd:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/data/entrada/evaluacion_pesos'; Copy-Item -Path 'd:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/data/procesados/evaluacion_pesos/*.xlsx' -Destination 'd:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/data/entrada/evaluacion_pesos/' -Force"])

subprocess.run(["d:/Proyecto2026/ACP_DWH/ACP Proyecciones/.venv/Scripts/python.exe", "d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL/pipeline.py"])
