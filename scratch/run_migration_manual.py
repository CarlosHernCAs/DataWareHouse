import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ETL'))
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.begin() as conn:
    # 1. Clean duplicates
    print("Cleaning duplicates...")
    res = conn.execute(text("""
        DELETE FROM Silver.Fact_Ciclos_Fenologicos
        WHERE ID_Ciclo_Fenologico_Silver NOT IN (
            SELECT MIN(ID_Ciclo_Fenologico_Silver)
            FROM Silver.Fact_Ciclos_Fenologicos
            GROUP BY ID_Geografia, ID_Tiempo, ID_Variedad, Cama, Tipo_Evaluacion, ID_Estado_Fenologico, ID_Cinta, Organo
        )
    """))
    print(f"Rows deleted: {res.rowcount}")

    # 2. Drop old index
    print("Dropping old index if exists...")
    conn.execute(text("""
        IF EXISTS (
            SELECT 1 FROM sys.indexes 
            WHERE name = 'UX_Fact_Ciclos_Fenologicos_Grain'
              AND object_id = OBJECT_ID('Silver.Fact_Ciclos_Fenologicos')
        )
        DROP INDEX UX_Fact_Ciclos_Fenologicos_Grain ON Silver.Fact_Ciclos_Fenologicos
    """))
    print("Old index dropped.")

    # 3. Create new index
    print("Creating new unique index...")
    conn.execute(text("""
        CREATE UNIQUE NONCLUSTERED INDEX UX_Fact_Ciclos_Fenologicos_Grain
        ON Silver.Fact_Ciclos_Fenologicos
            (ID_Geografia, ID_Tiempo, ID_Variedad, Cama, Tipo_Evaluacion, ID_Estado_Fenologico, ID_Cinta, Organo)
        WHERE ID_Estado_Fenologico IS NOT NULL
    """))
    print("New unique index created.")
