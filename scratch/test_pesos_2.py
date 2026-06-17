import pyodbc
import pandas as pd

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
df = pd.read_sql("SELECT TOP 20 Cosechables_Raw, PesoCosechables_Raw FROM Bronce.Evaluacion_Pesos WHERE Estado_Carga = 'PENDIENTE'", c)
print(df)
