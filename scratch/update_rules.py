import pyodbc

def run_update():
    conn = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
    cursor = conn.cursor()
    
    # 1. Correct Modulo 9 rules
    cursor.execute("""
        UPDATE MDM.Regla_Modulo_Turno_SubModulo
        SET Modulo_Raw_Base = '9'
        WHERE Modulo_Raw_Base = '9.'
    """)
    rows_mod9 = cursor.rowcount
    print(f"Corrected Modulo_Raw_Base from '9.' to '9' in {rows_mod9} rows.")
    
    # 2. Activate inactive rules
    cursor.execute("""
        UPDATE MDM.Regla_Modulo_Turno_SubModulo
        SET Es_Activa = 1
        WHERE Es_Activa = 0
    """)
    rows_act = cursor.rowcount
    print(f"Activated {rows_act} inactive rules.")
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    run_update()
