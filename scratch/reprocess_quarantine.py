import pyodbc

def reset_quarantine():
    # Read sql migration file content
    with open('ETL/sql_migrations/fase63_reintentar_cuarentena.sql', 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Remove GO if it is at the end
    if 'GO' in sql_content:
        sql_content = sql_content.replace('GO', '')
        
    conn = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
    cursor = conn.cursor()
    
    print("=== Resetting Quarantine/Rejected Rows in Bronce Tables ===")
    cursor.execute(sql_content)
    
    # Check if there is a result set returned (resumen)
    try:
        rows = cursor.fetchall()
        print("Reset Results:")
        for r in rows:
            print(f"  Table: {r[0]:<40} | Before: {r[1]:<5} | Reset: {r[2]}")
            
        if cursor.nextset():
            total_row = cursor.fetchone()
            print(f"Total Rows Reset: {total_row[0]} | Tables Processed: {total_row[1]}")
    except Exception as e:
        print(f"Could not read result set: {e}")
        
    conn.commit()
    conn.close()

if __name__ == '__main__':
    reset_quarantine()
