import sys
import pandas as pd
import json
sys.path.append('d:/Proyecto2026/ACP_DWH/ACP Proyecciones/ETL')
from config.conexion import obtener_engine
from silver.facts._helpers_fact_comunes import parsear_valores_raw

engine = obtener_engine()

sql = """
WITH CTE AS (
    SELECT *, 
    COUNT(*) OVER(PARTITION BY Modulo_Raw, Turno_Raw, Valvula_Raw, Fecha_Raw, Variedad_Raw, Tipo_Evaluacion_Raw, Punto_Raw) as grp_cnt 
    FROM Bronce.Evaluacion_Calidad_Poda
) 
SELECT Modulo_Raw, Turno_Raw, Valvula_Raw, Fecha_Raw, Tipo_Evaluacion_Raw, Punto_Raw, Fecha_Sistema, Valores_Raw 
FROM CTE 
WHERE grp_cnt > 1 AND Modulo_Raw='01' AND Turno_Raw='01' AND Valvula_Raw='1' AND Punto_Raw='1'
ORDER BY Fecha_Sistema DESC
"""

df = pd.read_sql(sql, engine)

parsed = [parsear_valores_raw(r) for r in df['Valores_Raw']]
df_parsed = pd.DataFrame(parsed)

pd.set_option('display.max_columns', None)
print("Raw columns available in dict:")
print(df_parsed.columns.tolist())
print("\nSample values for Punto 1:")
print(df_parsed[['Fecha_Registro_Raw', 'Subida_Raw', 'Tallos_Planta_Raw', 'Longitud_de_Tallo_Raw', 'Diametro_de_Tallo_Raw']].head(10))

