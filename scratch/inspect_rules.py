import pyodbc
import pandas as pd

def test():
    conn = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
    cursor = conn.cursor()
    
    print("=== Silver.Fact_Conteo_Fenologico columns ===")
    cursor.execute("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='Silver' AND TABLE_NAME='Fact_Conteo_Fenologico'")
    for col in cursor.fetchall():
        print(col)
        
    print("\n=== Checking all rows in Silver.Fact_Conteo_Fenologico grouped by variety ===")
    df_all = pd.read_sql("""
        SELECT v.Nombre_Variedad, COUNT(*) as Total_Filas
        FROM Silver.Fact_Conteo_Fenologico f
        JOIN Silver.Dim_Variedad v ON f.ID_Variedad = v.ID_Variedad
        GROUP BY v.Nombre_Variedad
    """, conn)
    print(df_all.to_string())
    
    conn.close()

if __name__ == '__main__':
    test()
