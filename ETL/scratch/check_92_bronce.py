import pandas as pd
from config.conexion import obtener_engine

def run():
    engine = obtener_engine()
    sql = """
    SELECT Modulo_Raw, Linea_Raw, Variedad_Raw, Estado_Planta_Raw, Cantidad_Raw, COUNT(*) as Frecuencia
    FROM Bronce.Censo_Plantas
    WHERE Modulo_Raw = '9.2'
    GROUP BY Modulo_Raw, Linea_Raw, Variedad_Raw, Estado_Planta_Raw, Cantidad_Raw
    ORDER BY Frecuencia DESC
    """
    try:
        df = pd.read_sql_query(sql, engine)
        print("Filas de Modulo 9.2 en Bronce:")
        print(df.to_string(index=False))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    run()
