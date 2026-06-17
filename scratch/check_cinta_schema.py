import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ETL'))
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    # FK de las tablas
    res = conn.execute(text("""
        SELECT 
            fk.name AS fk_name,
            OBJECT_NAME(fk.parent_object_id) AS tabla,
            COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS columna,
            OBJECT_NAME(fk.referenced_object_id) AS tabla_ref,
            COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS columna_ref
        FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
        WHERE OBJECT_NAME(fk.parent_object_id) IN ('Fact_Ciclos_Fenologicos', 'Mart_Fenologia')
    """)).fetchall()
    print('=== FKs de Fact_Ciclos_Fenologicos y Mart_Fenologia ===')
    for r in res: print(r)

    # Color_Cinta no nulos en Silver
    res2 = conn.execute(text("""
        SELECT Color_Cinta, COUNT(*) as cnt
        FROM Silver.Fact_Ciclos_Fenologicos
        WHERE Color_Cinta IS NOT NULL
        GROUP BY Color_Cinta
        ORDER BY cnt DESC
    """)).fetchall()
    print('\n=== Valores Color_Cinta en Silver.Fact_Ciclos_Fenologicos ===')
    for r in res2: print(r)

    # Ver columnas de Bronce que sean ID_*_Raw relacionados a Cinta
    res3 = conn.execute(text("""
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'Bronce' AND TABLE_NAME = 'Ciclos_Fenologicos'
        ORDER BY ORDINAL_POSITION
    """)).fetchall()
    print('\n=== Columnas Bronce.Ciclos_Fenologicos ===')
    for r in res3: print(r[0])
