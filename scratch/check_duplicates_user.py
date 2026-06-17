import os
from sqlalchemy import create_engine, text
import pandas as pd

engine = create_engine("mssql+pyodbc:///?odbc_connect=Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;TrustServerCertificate=yes;")

try:
    with engine.connect() as conn:
        df = pd.read_sql(text("""
            SELECT 
                b.Fecha_Raw, b.Modulo_Raw, b.Valvula_Raw, b.Cama_Raw, 
                b.Planta_Brote_Raw, b.Tallo_Raw, b.Cantidad_Raw, b.Valores_Raw
            FROM Bronce.Tasa_Crecimiento_Brotes b
            WHERE b.Fecha_Raw = '2024-06-03' 
              AND b.Modulo_Raw = '11.2' 
              AND b.Valvula_Raw = '12'
              AND b.Planta_Brote_Raw = 'P1B3'
        """), conn)
        print("=== COMPROBACION HASTA VALVULA ===")
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
