import pyodbc

conn = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = conn.cursor()

print("=== Nulos o Ceros en Silver.Fact_Evaluacion_Vegetativa ===")
query_sil = """
SELECT 
    COUNT(*) as Total_Filas,
    SUM(CASE WHEN ID_Geografia IS NULL THEN 1 ELSE 0 END) as Nulos_Geo,
    SUM(CASE WHEN ID_Tiempo IS NULL THEN 1 ELSE 0 END) as Nulos_Tiempo,
    SUM(CASE WHEN ID_Variedad IS NULL THEN 1 ELSE 0 END) as Nulos_Var,
    SUM(CASE WHEN Piso IS NULL THEN 1 ELSE 0 END) as Nulos_Piso,
    SUM(CASE WHEN Semanas_Despues_Poda = 0 THEN 1 ELSE 0 END) as Ceros_Semanas,
    SUM(CASE WHEN Altura = 0 THEN 1 ELSE 0 END) as Ceros_Altura,
    SUM(CASE WHEN Tallos_Basales = 0 THEN 1 ELSE 0 END) as Ceros_Tallos_B,
    SUM(CASE WHEN Tallos_Basales_Nuevos = 0 THEN 1 ELSE 0 END) as Ceros_Tallos_N,
    SUM(CASE WHEN Muestra_Plantas = 0 THEN 1 ELSE 0 END) as Ceros_Muestra,
    SUM(CASE WHEN Brotes_Generales = 0 THEN 1 ELSE 0 END) as Ceros_Brotes_G,
    SUM(CASE WHEN Brotes_Productivos = 0 THEN 1 ELSE 0 END) as Ceros_Brotes_P,
    SUM(CASE WHEN Diametro_Brote = 0 THEN 1 ELSE 0 END) as Ceros_Diametro
FROM Silver.Fact_Evaluacion_Vegetativa
"""
cursor.execute(query_sil)
res = cursor.fetchone()
cols = ['Total_Filas', 'Nulos_Geo', 'Nulos_Tiempo', 'Nulos_Var', 'Nulos_Piso', 
        'Ceros_Semanas', 'Ceros_Altura', 'Ceros_Tallos_B', 'Ceros_Tallos_N', 
        'Ceros_Muestra', 'Ceros_Brotes_G', 'Ceros_Brotes_P', 'Ceros_Diametro']
for c, v in zip(cols, res):
    pct = (v / res[0] * 100) if res[0] > 0 else 0
    print(f"  {c:20}: {v:10} ({pct:.2f}%)")

print("\n=== Nulos o Ceros en Gold.Mart_Evaluacion_Vegetativa ===")
query_gold = """
SELECT 
    COUNT(*) as Total_Filas,
    SUM(CASE WHEN Modulo = 0 THEN 1 ELSE 0 END) as Ceros_Modulo,
    SUM(CASE WHEN Variedad = 'SIN_VARIEDAD' THEN 1 ELSE 0 END) as Sin_Variedad,
    SUM(CASE WHEN Semanas_Despues_Poda_Promedio = 0 THEN 1 ELSE 0 END) as Ceros_Semanas_Prom,
    SUM(CASE WHEN Altura_Promedio = 0 THEN 1 ELSE 0 END) as Ceros_Altura_Prom,
    SUM(CASE WHEN Tallos_Basales_Promedio = 0 THEN 1 ELSE 0 END) as Ceros_Tallos_B_Prom,
    SUM(CASE WHEN Muestra_Plantas_Total = 0 THEN 1 ELSE 0 END) as Ceros_Muestra_Tot,
    SUM(CASE WHEN Brotes_Generales_Promedio = 0 THEN 1 ELSE 0 END) as Ceros_Brotes_G_Prom,
    SUM(CASE WHEN Brotes_Productivos_Promedio = 0 THEN 1 ELSE 0 END) as Ceros_Brotes_P_Prom,
    SUM(CASE WHEN Diametro_Brote_Promedio = 0 THEN 1 ELSE 0 END) as Ceros_Diametro_Prom
FROM Gold.Mart_Evaluacion_Vegetativa
"""
cursor.execute(query_gold)
res_g = cursor.fetchone()
cols_g = ['Total_Filas', 'Ceros_Modulo', 'Sin_Variedad', 'Ceros_Semanas_Prom', 
          'Ceros_Altura_Prom', 'Ceros_Tallos_B_Prom', 'Ceros_Muestra_Tot', 
          'Ceros_Brotes_G_Prom', 'Ceros_Brotes_P_Prom', 'Ceros_Diametro_Prom']
for c, v in zip(cols_g, res_g):
    pct = (v / res_g[0] * 100) if res_g[0] > 0 else 0
    print(f"  {c:25}: {v:10} ({pct:.2f}%)")

conn.close()
