import os
from sqlalchemy import create_engine, text

engine = create_engine("mssql+pyodbc:///?odbc_connect=Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;TrustServerCertificate=yes;")

try:
    with engine.begin() as conn:
        result = conn.execute(text("DELETE FROM MDM.Cuarentena WHERE Tabla_Origen = 'Silver.Fact_Tasa_Crecimiento_Brotes' AND Motivo = 'CONDICION_NULL;'"))
        print(f"Borrados {result.rowcount} falsos positivos en cuarentena.")
except Exception as e:
    print(f"Error: {e}")
