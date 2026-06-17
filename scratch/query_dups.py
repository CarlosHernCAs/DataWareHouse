import sys
import pandas as pd
sys.path.append('d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL')
from config.conexion import obtener_engine

engine = obtener_engine()

sql = """
WITH CTE AS (
    SELECT *, 
    ROW_NUMBER() OVER(PARTITION BY Modulo_Raw, Turno_Raw, Valvula_Raw, Fecha_Raw, Variedad_Raw, Tipo_Evaluacion_Raw, Punto_Raw ORDER BY Fecha_Sistema DESC) as rn, 
    COUNT(*) OVER(PARTITION BY Modulo_Raw, Turno_Raw, Valvula_Raw, Fecha_Raw, Variedad_Raw, Tipo_Evaluacion_Raw, Punto_Raw) as grp_cnt 
    FROM Bronce.Evaluacion_Calidad_Poda
) 
SELECT Modulo_Raw, Turno_Raw, Valvula_Raw, Punto_Raw, Fecha_Sistema, Valores_Raw 
FROM CTE 
WHERE grp_cnt > 1 
ORDER BY Modulo_Raw, Turno_Raw, Valvula_Raw, Punto_Raw, Fecha_Sistema DESC
"""

df = pd.read_sql(sql, engine)
pd.set_option('display.max_colwidth', 80)
print(df.head(20))
print("Total duplicates in this group count:", len(df))
