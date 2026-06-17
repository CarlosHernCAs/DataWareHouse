import os
from sqlalchemy import create_engine, text
import pandas as pd

engine = create_engine("mssql+pyodbc:///?odbc_connect=Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;TrustServerCertificate=yes;")

try:
    with engine.begin() as conn:
        print("Trunco Tasa_Crecimiento_Brotes en Bronce y Silver")
        conn.execute(text("TRUNCATE TABLE Bronce.Tasa_Crecimiento_Brotes"))
        conn.execute(text("TRUNCATE TABLE Silver.Fact_Tasa_Crecimiento_Brotes"))
        conn.execute(text("DELETE FROM MDM.Cuarentena WHERE Tabla_Origen = 'Bronce.Tasa_Crecimiento_Brotes'"))
        
        # Opcional: resetear estado_carga de origen de Excel, si tenemos acceso a esa tabla
        # Pero dejare que el usuario corra el pipeline completo
except Exception as e:
    print(f"Error: {e}")
