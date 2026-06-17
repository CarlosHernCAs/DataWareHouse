import pyodbc

def insert_varieties():
    conn = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
    cursor = conn.cursor()
    
    # 1. Check if ID_Variedad is an IDENTITY column
    cursor.execute("""
        SELECT COLUMNPROPERTY(OBJECT_ID('Silver.Dim_Variedad'), 'ID_Variedad', 'IsIdentity')
    """)
    is_identity = cursor.fetchone()[0]
    print(f"Table Silver.Dim_Variedad has IDENTITY: {is_identity}")
    
    varieties_to_insert = [
        'RAYMI',
        'FLORIDA MAGNUS',
        'SWEEP CREEP'
    ]
    
    # Determine the maximum ID if it's not identity
    max_id = 0
    if not is_identity:
        cursor.execute("SELECT MAX(ID_Variedad) FROM Silver.Dim_Variedad")
        max_id_val = cursor.fetchone()[0]
        max_id = max_id_val if max_id_val is not None else 0
        print(f"Current maximum ID_Variedad: {max_id}")
        
    for name in varieties_to_insert:
        # Check if it already exists
        cursor.execute("SELECT ID_Variedad, Nombre_Variedad, Breeder FROM Silver.Dim_Variedad WHERE UPPER(Nombre_Variedad) = ?", (name,))
        row = cursor.fetchone()
        
        if row:
            print(f"Variety '{name}' ALREADY EXISTS with ID={row[0]}, Breeder={row[2]}")
        else:
            # Let's clean the name case (e.g. Title Case or keep Uppercase? In the catalog we see: Jewel, Star, Ventura, Sekoya Pop, ALESSIA BLUE, MEGA CRISP, etc. Let's keep the user's casing or make it clean title case. Let's make it standard: e.g. Raymi, Florida Magnus, Sweep Creep)
            formatted_name = name.title() if name != 'RAYMI' else 'Raymi' # Or just keep original uppercase. Let's use clean title casing but if it's Raymi keep it as 'Raymi'.
            
            if is_identity:
                cursor.execute("""
                    INSERT INTO Silver.Dim_Variedad (Nombre_Variedad, Breeder, Es_Activa, Fecha_Creacion)
                    VALUES (?, 'POR_DEFINIR', 1, GETDATE())
                """, (formatted_name,))
                conn.commit()
                # Get the inserted identity
                cursor.execute("SELECT @@IDENTITY")
                new_id = int(cursor.fetchone()[0])
            else:
                max_id += 1
                cursor.execute("""
                    INSERT INTO Silver.Dim_Variedad (ID_Variedad, Nombre_Variedad, Breeder, Es_Activa, Fecha_Creacion)
                    VALUES (?, ?, 'POR_DEFINIR', 1, GETDATE())
                """, (max_id, formatted_name))
                conn.commit()
                new_id = max_id
                
            print(f"Variety '{formatted_name}' INSERTED with ID={new_id}")
            
    conn.close()

if __name__ == '__main__':
    insert_varieties()
