import pandas as pd
from config.conexion import obtener_engine

def run():
    engine = obtener_engine()
    sql = """
    SELECT 
        Estado_Planta_Raw, 
        COUNT(*) as Filas_Totales_en_Bronce, 
        SUM(CAST(Cantidad_Raw AS BIGINT)) as Suma_Plantas, 
        MAX(CAST(Cantidad_Raw AS BIGINT)) as Planta_Mas_Alta_Sola
    FROM Bronce.Censo_Plantas
    WHERE Modulo_Raw = '9.2' AND Estado_Planta_Raw = 'Buenas'
    GROUP BY Estado_Planta_Raw
    """
    sql2 = """
    SELECT Top 10 Cantidad_Raw, COUNT(*) as Frecuencia
    FROM Bronce.Censo_Plantas
    WHERE Modulo_Raw = '9.2' AND Estado_Planta_Raw = 'Buenas'
    GROUP BY Cantidad_Raw
    ORDER BY Frecuencia DESC
    """
    try:
        print("Resumen de BUENAS para modulo 9.2:")
        print(pd.read_sql_query(sql, engine).to_string(index=False))
        print("\nFrecuencias de 'Buenas' en 9.2:")
        print(pd.read_sql_query(sql2, engine).to_string(index=False))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    run()
