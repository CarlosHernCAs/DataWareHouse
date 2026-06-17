import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ETL'))
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()

# Leer el archivo SQL
ruta_sql = os.path.join(os.path.dirname(__file__), '..', 'ETL', 'sql_migrations', 'fase67_purgar_columnas_ciclos_fenologicos.sql')
with open(ruta_sql, 'r', encoding='utf-8') as f:
    contenido = f.read()

# Dividir por GO y ejecutar
print("=== Ejecutando Fase 67 ===")
with engine.begin() as conn:
    for cmd in contenido.split('GO'):
        cmd_clean = cmd.strip()
        if not cmd_clean:
            continue
        try:
            conn.execute(text(cmd_clean))
            print("[OK] Instrucción ejecutada con éxito.")
        except Exception as e:
            print(f"[ERR] Error ejecutando instrucción: {e}")

print("\n=== Estructura Final de Silver.Fact_Ciclos_Fenologicos ===")
with engine.connect() as conn:
    cols = conn.execute(text("""
        SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'Silver' AND TABLE_NAME = 'Fact_Ciclos_Fenologicos'
        ORDER BY ORDINAL_POSITION
    """)).fetchall()
    for c in cols:
        print(f"  {c[0]:35} {c[1]}")
