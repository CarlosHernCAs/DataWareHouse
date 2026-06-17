import sys
sys.path.insert(0, '.')
from config.conexion import obtener_engine
import pandas as pd

try:
    df = pd.read_sql_query("SELECT Nombre_Archivo, COUNT(*) as Filas FROM Bronce.Censo_Plantas GROUP BY Nombre_Archivo", obtener_engine())
    print(df.to_markdown(index=False))
except Exception as e:
    print(e)
