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
WHERE grp_cnt > 1 
ORDER BY Modulo_Raw, Turno_Raw, Valvula_Raw, Fecha_Raw, Tipo_Evaluacion_Raw, Punto_Raw, Fecha_Sistema DESC
"""

df = pd.read_sql(sql, engine)

def get_tallos(raw_str):
    d = parsear_valores_raw(raw_str)
    return d.get('TallosPlanta_Raw')

def get_registro(raw_str):
    d = parsear_valores_raw(raw_str)
    return d.get('Fecha_Registro_Raw')

df['Tallos'] = df['Valores_Raw'].apply(get_tallos)
df['Registro'] = df['Valores_Raw'].apply(get_registro)

pd.set_option('display.max_columns', None)
print(df[['Modulo_Raw', 'Turno_Raw', 'Valvula_Raw', 'Punto_Raw', 'Registro', 'Tallos']].head(20))
