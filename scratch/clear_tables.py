import os
from sqlalchemy import create_engine, text

engine = create_engine("mssql+pyodbc:///?odbc_connect=Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;TrustServerCertificate=yes;")

try:
    with engine.connect() as conn:
        with conn.begin():
            # Delete Quarantine records specifically for this fact table
            conn.execute(text("DELETE FROM MDM.Cuarentena WHERE Tabla_Origen = 'Silver.Fact_Tasa_Crecimiento_Brotes';"))
            print("Deleted MDM.Cuarentena for Silver.Fact_Tasa_Crecimiento_Brotes")
            
            print("\n=== Limpieza completada con exito ===")
except Exception as e:
    print(f"Error: {e}")
