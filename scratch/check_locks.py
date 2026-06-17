import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("Checking active executions and locks in SQL Server:")
    query = text("""
        SELECT 
            r.session_id,
            r.status,
            r.command,
            r.wait_type,
            r.wait_time,
            r.blocking_session_id,
            t.text AS sql_text
        FROM sys.dm_exec_requests r
        CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
        WHERE r.session_id <> @@SPID
    """)
    res = conn.execute(query).fetchall()
    if not res:
        print("No other active queries found.")
    for row in res:
        print(f"Session {row.session_id}: status={row.status}, cmd={row.command}, wait={row.wait_type} ({row.wait_time}ms), blocked_by={row.blocking_session_id}")
        print(f"SQL: {row.sql_text[:200]}...")
        print("-" * 50)
