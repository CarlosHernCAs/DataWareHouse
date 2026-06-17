import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

print("Schema for Silver.Fact_Fisiologia:")
cursor.execute("""
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'Silver' AND TABLE_NAME = 'Fact_Fisiologia'
""")
for r in cursor.fetchall():
    print(f"Col: {r[0]:25} | Type: {r[1]:15} | Length: {r[2]}")

c.close()
