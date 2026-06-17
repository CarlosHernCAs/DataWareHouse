import pyodbc
import pandas as pd

def check_locks():
    conn = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
    
    print("=== Blocking Sessions ===")
    df_blocking = pd.read_sql("""
        SELECT 
            blocking_session_id AS blocking_session,
            session_id AS blocked_session,
            wait_time,
            wait_type,
            last_wait_type
        FROM sys.dm_exec_requests
        WHERE blocking_session_id <> 0
    """, conn)
    print(df_blocking.to_string())
    
    print("\n=== Active Sessions ===")
    df_sessions = pd.read_sql("""
        SELECT session_id, login_name, status, cpu_time, memory_usage, total_elapsed_time
        FROM sys.dm_exec_sessions
        WHERE is_user_process = 1
    """, conn)
    print(df_sessions.to_string())
    
    print("\n=== Active Tran Locks ===")
    df_locks = pd.read_sql("""
        SELECT request_session_id AS session_id,
               resource_type,
               resource_database_id,
               request_mode,
               request_status
        FROM sys.dm_tran_locks
        WHERE resource_database_id = DB_ID()
    """, conn)
    print(df_locks.to_string())
    
    conn.close()

if __name__ == '__main__':
    check_locks()
