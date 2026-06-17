import pyodbc
import pandas as pd

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
df = pd.read_sql("SELECT Ano_Raw, Semana_Raw, Turno_Raw, Variedad_Raw, COUNT(*) as cnt FROM Bronce.Evaluacion_Pesos WHERE Estado_Carga = 'CARGADO' GROUP BY Ano_Raw, Semana_Raw, Turno_Raw, Variedad_Raw ORDER BY cnt DESC", c)
print(df.head(20))
