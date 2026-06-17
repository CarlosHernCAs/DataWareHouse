"""
Completa la migración fase66:
- Dropa el índice UX_Fact_Ciclos_Fenologicos_Grain (que bloquea el DROP COLUMN Categoria)
- Agrega ID_Estado_Fenologico y lo puebla
- Dropea Categoria
- Crea nuevo índice sobre ID_Estado_Fenologico
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ETL'))
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()

pasos = [
    # Ver índices actuales
    ("Consultar índices", """
        SELECT i.name, c.name as col_name
        FROM sys.indexes i
        JOIN sys.index_columns ic ON i.object_id=ic.object_id AND i.index_id=ic.index_id
        JOIN sys.columns c ON ic.object_id=c.object_id AND ic.column_id=c.column_id
        WHERE OBJECT_NAME(i.object_id) = 'Fact_Ciclos_Fenologicos'
        ORDER BY i.name, ic.key_ordinal
    """),
]

print('=== Índices actuales ===')
with engine.connect() as conn:
    res = conn.execute(text(pasos[0][1])).fetchall()
    for r in res:
        print(f"  {r[0]}  ->  {r[1]}")

    # Ver columnas actuales
    cols = conn.execute(text("""
        SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'Silver' AND TABLE_NAME = 'Fact_Ciclos_Fenologicos'
        ORDER BY ORDINAL_POSITION
    """)).fetchall()
    print('\nColumnas actuales:')
    for c in cols:
        print(f"  {c[0]:35} {c[1]}")

print()

modificaciones = [
    # 1. ADD ID_Estado_Fenologico (por si acaso, idempotente)
    ("ADD ID_Estado_Fenologico",
     "IF COL_LENGTH('Silver.Fact_Ciclos_Fenologicos', 'ID_Estado_Fenologico') IS NULL "
     "ALTER TABLE Silver.Fact_Ciclos_Fenologicos ADD ID_Estado_Fenologico INT NULL"),
]

with engine.begin() as conn:
    for nombre, sql in modificaciones:
        try:
            res = conn.execute(text(sql))
            print(f'[OK] {nombre}')
        except Exception as e:
            print(f'[ERR] {nombre}: {e}')

# Poblar ID_Estado_Fenologico (conexión nueva para que vea la columna)
poblar = [
    ("Poblar ID_Estado directo", """
        UPDATE f SET f.ID_Estado_Fenologico = ef.ID_Estado_Fenologico
        FROM Silver.Fact_Ciclos_Fenologicos f
        JOIN Silver.Dim_Estado_Fenologico ef
            ON LOWER(TRIM(ef.Nombre_Estado)) = LOWER(TRIM(f.Categoria))
        WHERE f.ID_Estado_Fenologico IS NULL AND f.Categoria IS NOT NULL
    """),
    ("Poblar ID_Estado aliases", """
        UPDATE f SET f.ID_Estado_Fenologico = alias_map.ID_Estado_Fenologico
        FROM Silver.Fact_Ciclos_Fenologicos f
        JOIN (VALUES
            ('ffase1',         5), ('ffase2',         6),
            ('inicio fase 1',  5), ('inicio fase 2',  6),
            ('cosecha',        9), ('floracion',       2),
            ('floración',      2), ('pequena',         3),
            ('pequeña',        3), ('punta verde',     4),
            ('yema',           10)
        ) AS alias_map(Alias, ID_Estado_Fenologico)
            ON LOWER(TRIM(f.Categoria)) = alias_map.Alias
        WHERE f.ID_Estado_Fenologico IS NULL AND f.Categoria IS NOT NULL
    """),
    # DROP índice que bloquea DROP COLUMN Categoria
    ("DROP INDEX UX_Grain (si existe)", """
        IF EXISTS (
            SELECT 1 FROM sys.indexes 
            WHERE name = 'UX_Fact_Ciclos_Fenologicos_Grain'
            AND OBJECT_NAME(object_id) = 'Fact_Ciclos_Fenologicos'
        )
        DROP INDEX UX_Fact_Ciclos_Fenologicos_Grain ON Silver.Fact_Ciclos_Fenologicos
    """),
    # DROP Categoria
    ("DROP Categoria",
     "IF COL_LENGTH('Silver.Fact_Ciclos_Fenologicos', 'Categoria') IS NOT NULL "
     "ALTER TABLE Silver.Fact_Ciclos_Fenologicos DROP COLUMN Categoria"),
    # Nuevo índice con ID_Estado_Fenologico
    ("CREATE INDEX nuevo grain", """
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes 
            WHERE name = 'UX_Fact_Ciclos_Fenologicos_Grain'
            AND OBJECT_NAME(object_id) = 'Fact_Ciclos_Fenologicos'
        )
        CREATE UNIQUE INDEX UX_Fact_Ciclos_Fenologicos_Grain
        ON Silver.Fact_Ciclos_Fenologicos
            (ID_Geografia, ID_Tiempo, ID_Variedad, Cama, Tipo_Evaluacion, ID_Estado_Fenologico)
        WHERE ID_Estado_Fenologico IS NOT NULL
    """),
]

with engine.begin() as conn:
    for nombre, sql in poblar:
        try:
            res = conn.execute(text(sql))
            rc = getattr(res, 'rowcount', '?')
            print(f'[OK] {nombre}  (rows={rc})')
        except Exception as e:
            print(f'[ERR] {nombre}: {e}')

# Verificar final
print('\n=== Columnas finales ===')
with engine.connect() as conn:
    cols = conn.execute(text("""
        SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'Silver' AND TABLE_NAME = 'Fact_Ciclos_Fenologicos'
        ORDER BY ORDINAL_POSITION
    """)).fetchall()
    for c in cols:
        print(f"  {c[0]:35} {c[1]}")

    stats = conn.execute(text("""
        SELECT COUNT(*) as total,
               SUM(CASE WHEN ID_Estado_Fenologico IS NOT NULL THEN 1 ELSE 0 END) as con_estado,
               SUM(CASE WHEN ID_Cinta IS NOT NULL THEN 1 ELSE 0 END) as con_cinta
        FROM Silver.Fact_Ciclos_Fenologicos
    """)).fetchone()
    print(f'\nTotal: {stats[0]} | Con ID_Estado: {stats[1]} ({stats[1]/stats[0]*100:.1f}%) | Con ID_Cinta: {stats[2]}')
