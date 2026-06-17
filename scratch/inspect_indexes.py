import pyodbc
c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

def check_indexes(table_name):
    print(f"\nIndexes for {table_name}:")
    q = """
    SELECT 
        i.name AS IndexName,
        c.name AS ColumnName,
        i.is_unique AS IsUnique
    FROM sys.indexes i
    INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID(?)
    ORDER BY i.name, ic.key_ordinal
    """
    cursor.execute(q, (table_name,))
    for r in cursor.fetchall():
        print(f"  Index: {r[0]}, Column: {r[1]}, Unique: {r[2]}")

check_indexes("Silver.Fact_Induccion_Floral")
check_indexes("Silver.Fact_Fisiologia")

c.close()
