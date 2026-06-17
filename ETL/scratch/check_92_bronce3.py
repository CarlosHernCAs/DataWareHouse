import pandas as pd
from config.conexion import obtener_engine

def run():
    engine = obtener_engine()
    sql = """
    SELECT 
        Modulo_Raw, 
        Turno_Raw, 
        Valvula_Raw, 
        Variedad_Raw, 
        Estado_Planta_Raw, 
        Cantidad_Raw, 
        COUNT(*) as Frecuencia
    FROM Bronce.Censo_Plantas
    WHERE Modulo_Raw = '9.2' AND Estado_Planta_Raw = 'Buenas'
    GROUP BY Modulo_Raw, Turno_Raw, Valvula_Raw, Variedad_Raw, Estado_Planta_Raw, Cantidad_Raw
    ORDER BY Frecuencia DESC
    """
    try:
        print("Frecuencia detallada con Turno y Valvula:")
        print(pd.read_sql_query(sql, engine).to_string(index=False))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    run()
