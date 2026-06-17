import pyodbc
import pandas as pd

def test_sp():
    conn = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
    cursor = conn.cursor()
    
    test_cases = [
        # (Modulo, Turno, Expected Modulo_Int, Expected SubModulo_Int)
        ('9', '5', 9, 2), # Turnos 1..11 -> Submodulo 2 (Maceta)
        ('9', '15', 9, 1), # Turnos 12..18 -> Submodulo 1 (Suelo)
        ('11', '5', 11, 1), # Turnos 1..12 -> Submodulo 1 (Suelo)
        ('11', '15', 11, 2), # Turnos 13..24 -> Submodulo 2 (Maceta)
    ]
    
    print("=== Testing Silver.sp_Resolver_Geografia_Cama ===")
    for mod, turno, exp_mod, exp_sub in test_cases:
        cursor.execute("EXEC Silver.sp_Resolver_Geografia_Cama @Modulo_Raw=?, @Turno_Raw=?, @Valvula_Raw='1', @Cama_Raw='0'", (mod, turno))
        row = cursor.fetchone()
        
        # sp returns columns: Modulo_Token, Turno_Token, Valvula_Token, Cama_Token, Modulo_Int, SubModulo_Int, Turno_Int, Cama_Int, ID_Geografia, ID_Cama_Catalogo, Estado_Resolucion, Detalle
        # Let's inspect the returned values
        mod_int = row[4]
        sub_int = row[5]
        estado = row[10]
        detalle = row[11]
        
        print(f"Input: Modulo={mod}, Turno={turno}")
        print(f"  Got: Modulo_Int={mod_int}, SubModulo_Int={sub_int}, Estado={estado}, Detalle='{detalle}'")
        match = (mod_int == exp_mod and sub_int == exp_sub)
        print(f"  Result: {'PASS' if match else 'FAIL'} (Expected Modulo_Int={exp_mod}, SubModulo_Int={exp_sub})")
        print("-" * 50)
        
    conn.close()

    # Test Python lookup.py
    import sys
    sys.path.append('ETL')
    from mdm.lookup import _resolver_id_modulo_catalogo_con_reglas, limpiar_cache
    from sqlalchemy import create_engine

    engine = create_engine('mssql+pyodbc:///?odbc_connect=DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
    
    # Clean cache first to load new DB values
    limpiar_cache()

    print("\n=== Testing Python ETL lookup.py ===")
    test_cases_py = [
        # (Modulo_Raw, Turno_Raw, Expected ID_Modulo_Catalogo)
        ('9', '5', 12),  # Modulo 9, SubModulo 2 (Maceta) -> ID 12
        ('9', '15', 11), # Modulo 9, SubModulo 1 (Suelo) -> ID 11
        ('11', '5', 15), # Modulo 11, SubModulo 1 (Suelo) -> ID 15
        ('11', '15', 16) # Modulo 11, SubModulo 2 (Maceta) -> ID 16
    ]

    for mod, turno, exp_id in test_cases_py:
        id_mod, es_tb = _resolver_id_modulo_catalogo_con_reglas(engine, mod, turno)
        print(f"Input: Modulo={mod}, Turno={turno}")
        print(f"  Got: ID_Modulo_Catalogo={id_mod}, Es_Test_Block={es_tb}")
        match = (id_mod == exp_id)
        print(f"  Result: {'PASS' if match else 'FAIL'} (Expected ID_Modulo_Catalogo={exp_id})")
        print("-" * 50)

if __name__ == '__main__':
    test_sp()
