import pandas as pd
from config.conexion import obtener_engine

query = """
SELECT TOP 10 
    Campana_Raw, 
    Fecha_Raw, 
    Modulo_Raw, 
    Variedad_Raw, 
    Estado_Planta_Raw, 
    COUNT(*) as Filas_Duplicadas, 
    SUM(TRY_CAST(Cantidad_Raw AS INT)) as Total_Plantas 
FROM Bronce.Censo_Plantas 
WHERE ISNULL(Linea_Raw, '') IN ('', 'None', 'nan') 
GROUP BY 
    Campana_Raw, 
    Fecha_Raw, 
    Modulo_Raw, 
    Variedad_Raw, 
    Estado_Planta_Raw 
HAVING COUNT(*) > 1 
ORDER BY Filas_Duplicadas DESC
"""

engine = obtener_engine()
df = pd.read_sql_query(query, engine)
print(df.to_markdown(index=False))
