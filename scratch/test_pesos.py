import pyodbc
import pandas as pd

def safe_float(val, default=0.0):
    try:
        return float(str(val)) if val is not None and str(val).strip() not in ('', 'None', 'nan') else default
    except (ValueError, TypeError):
        return default

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
df = pd.read_sql("SELECT TOP 20 Cosechables_Raw, PesoCosechables_Raw, PesoBaya_Raw, CantMuestra_Raw FROM Bronce.Evaluacion_Pesos WHERE Estado_Carga = 'PENDIENTE'", c)
print(df)
