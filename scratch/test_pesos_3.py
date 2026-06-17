import pyodbc
import pandas as pd

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
df = pd.read_sql("SELECT Estado_Carga, COUNT(*) as qty FROM Bronce.Evaluacion_Pesos GROUP BY Estado_Carga", c)
print(df)
