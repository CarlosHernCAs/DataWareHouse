import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ETL'))
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("=== Indexes on Silver.Fact_Ciclos_Fenologicos ===")
    res = conn.execute(text("""
        SELECT 
            i.name AS IndexName,
            c.name AS ColumnName,
            i.is_unique AS IsUnique,
            i.filter_definition
        FROM sys.indexes i
        INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE i.object_id = OBJECT_ID('Silver.Fact_Ciclos_Fenologicos')
        ORDER BY i.name, ic.key_ordinal
    """)).fetchall()
    for r in res:
        print(f"Index: {r[0]} | Column: {r[1]} | Unique: {r[2]} | Filter: {r[3]}")
