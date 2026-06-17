#!/usr/bin/env python3
"""
Inspect BD schema para documentación humanizada.
Lee INFORMATION_SCHEMA y extrae: tabla, descripción, columnas, PK/FK, propósito.
"""
import sys
import os
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from sqlalchemy import create_engine, text, inspect

# Connection
DB_SERVIDOR = os.getenv("DB_SERVIDOR", ".")
DB_NOMBRE = os.getenv("DB_NOMBRE", "ACP_DataWarehose_Proyecciones")
DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

conn_str = f"mssql+pyodbc://@{DB_SERVIDOR}/{DB_NOMBRE}?driver={DB_DRIVER}&Trusted_Connection=yes&MARS_Connection=yes"
engine = create_engine(conn_str, echo=False, isolation_level="READ_COMMITTED")

# Lee metadata
inspector = inspect(engine)
schemas = inspector.get_schema_names()

result = {}
for schema in schemas:
    if schema in ["sys", "INFORMATION_SCHEMA", "pg_catalog"]: continue

    tables = inspector.get_table_names(schema=schema)
    result[schema] = {}

    for table_name in tables:
        cols = inspector.get_columns(table_name, schema=schema)
        pks = inspector.get_pk_constraint(table_name, schema=schema)
        fks = inspector.get_foreign_keys(table_name, schema=schema)
        indexes = inspector.get_indexes(table_name, schema=schema)

        result[schema][table_name] = {
            "columns": [{
                "name": c["name"],
                "type": str(c["type"]),
                "nullable": c["nullable"],
                "default": str(c["default"]) if c.get("default") else None
            } for c in cols],
            "pk": pks.get("constrained_columns", []) if pks else [],
            "fks": fks,
            "indexes": indexes,
            "row_count": None  # Se llena a continuación
        }

        # Row count
        try:
            with engine.connect() as conn:
                cnt = conn.execute(text(f"SELECT COUNT(*) FROM [{schema}].[{table_name}]")).scalar()
                result[schema][table_name]["row_count"] = cnt
        except:
            pass

# Output
print(json.dumps(result, indent=2, default=str))
