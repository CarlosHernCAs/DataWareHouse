import os
import pyodbc
from dotenv import load_dotenv

# Load env variables
load_dotenv(r'd:\Proyecto2026\ACP_DWH\ACP Proyecciones\.env')

server = os.getenv('DB_SERVIDOR', '.')
database = os.getenv('DB_NOMBRE', 'ACP_DataWarehose_Proyecciones')
driver = os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server')

conn_str = f"DRIVER={{{driver}}};SERVER={server};DATABASE={database};Trusted_Connection=yes;"

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Get views in Gold schema
    query = """
    SELECT 
        v.name AS view_name,
        m.definition AS view_definition
    FROM 
        sys.views v
    INNER JOIN 
        sys.schemas s ON v.schema_id = s.schema_id
    INNER JOIN 
        sys.sql_modules m ON v.object_id = m.object_id
    WHERE 
        s.name = 'Gold';
    """
    
    cursor.execute(query)
    views = cursor.fetchall()
    
    if not views:
        print("No se encontraron vistas en el esquema 'Gold'.")
    else:
        print(f"Se encontraron {len(views)} vistas en la capa Gold:\n")
        for view in views:
            print(f"--- VISTA: Gold.{view.view_name} ---")
            print(view.view_definition)
            print("-" * 50 + "\n")
            
except Exception as e:
    print(f"Error connecting to DB: {e}")
