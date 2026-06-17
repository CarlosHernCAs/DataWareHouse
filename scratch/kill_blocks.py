import pyodbc
c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=master;Trusted_Connection=yes;')
c.autocommit = True
cur = c.cursor()
cur.execute("""
SELECT session_id, blocking_session_id, wait_type, wait_time, wait_resource, command, 
       (SELECT text FROM sys.dm_exec_sql_text(sql_handle)) as sql_text
FROM sys.dm_exec_requests
WHERE blocking_session_id <> 0 OR session_id IN (SELECT blocking_session_id FROM sys.dm_exec_requests WHERE blocking_session_id <> 0)
""")
rows = cur.fetchall()
print("Blocking sessions:")
for r in rows:
    print(r)
