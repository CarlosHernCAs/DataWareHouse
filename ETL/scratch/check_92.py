import pandas as pd
from config.conexion import obtener_engine

def run():
    engine = obtener_engine()
    try:
        df_gold = pd.read_sql_query("SELECT Modulo, SUM(Cantidad) as Suma_Cantidad FROM Gold.Mart_Censo_Plantas WHERE Modulo = '9.2' GROUP BY Modulo", engine)
        print("GOLD 9.2:", df_gold.to_string())
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    run()
