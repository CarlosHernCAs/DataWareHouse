import pandas as pd
from config.conexion import obtener_engine

engine = obtener_engine()

# 1. Check Bronce for Modulo 9.2
query_bronce = """
SELECT 
    Campana_Raw, Fecha_Raw, Modulo_Raw, Linea_Raw, Variedad_Raw, Estado_Planta_Raw, Cantidad_Raw
FROM Bronce.Censo_Plantas
WHERE Modulo_Raw LIKE '%9.2%'
ORDER BY Fecha_Raw DESC
"""
df_bronce = pd.read_sql_query(query_bronce, engine)

print("--- BRONCE (Modulo 9.2) ---")
print(df_bronce.head(20).to_string())
print(f"Total filas en Bronce para 9.2: {len(df_bronce)}")

# Suma en bronce
query_bronce_sum = """
SELECT 
    Campana_Raw, Estado_Planta_Raw, SUM(TRY_CAST(Cantidad_Raw AS INT)) as Suma_Cantidad, COUNT(*) as Filas
FROM Bronce.Censo_Plantas
WHERE Modulo_Raw LIKE '%9.2%'
GROUP BY Campana_Raw, Estado_Planta_Raw
ORDER BY Campana_Raw, Estado_Planta_Raw
"""
df_bronce_sum = pd.read_sql_query(query_bronce_sum, engine)
print("\n--- SUMA EN BRONCE (Modulo 9.2) ---")
print(df_bronce_sum.to_string())

# 2. Check Gold for Modulo 9.2
query_gold = """
SELECT 
    Campana, Estado_Planta, SUM(Cantidad) as Suma_Cantidad, COUNT(*) as Filas
FROM Gold.Mart_Censo_Plantas
WHERE Modulo = '9.2'
GROUP BY Campana, Estado_Planta
ORDER BY Campana, Estado_Planta
"""
try:
    df_gold = pd.read_sql_query(query_gold, engine)
    print("\n--- SUMA EN GOLD (Modulo 9.2) ---")
    print(df_gold.to_string())
except Exception as e:
    print(f"\nError querying Gold: {e}")
