import pandas as pd
from config.conexion import obtener_engine

def run():
    engine = obtener_engine()
    sql = """
    SELECT Fundo, Modulo, Turno, Valvula
    FROM Silver.Dim_Geografia
    WHERE Modulo = '9.2'
    ORDER BY Fundo, Turno, Valvula
    """
    try:
        df = pd.read_sql_query(sql, engine)
        print("Geografias validas para Modulo 9.2 en Silver.Dim_Geografia:")
        print(df.to_string())
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    run()
