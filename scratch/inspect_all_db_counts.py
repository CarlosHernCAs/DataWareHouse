import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

print("=== Conteo de filas en todas las tablas de la BD ===")
cursor.execute("""
    SELECT 
        s.name AS SchemaName,
        t.name AS TableName,
        p.rows AS RowCnt
    FROM 
        sys.tables t
    INNER JOIN 
        sys.schemas s ON t.schema_id = s.schema_id
    INNER JOIN 
        sys.indexes i ON t.object_id = i.object_id
    INNER JOIN 
        sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
    WHERE 
        t.is_ms_shipped = 0 AND i.index_id IN (0,1)
    ORDER BY 
        p.rows DESC
""")
for row in cursor.fetchall():
    print(f"{row[0]}.{row[1]} : {row[2]:,}")

c.close()
