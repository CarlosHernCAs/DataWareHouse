import pandas as pd
from sqlalchemy import create_engine, text

# Conectar a la base de datos
engine = create_engine("mssql+pyodbc:///?odbc_connect=Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;TrustServerCertificate=yes;")

try:
    with engine.connect() as conn:
        print("=== Los 10 Primeros Registros Duplicados en Cuarentena ===")
        # Consultar los motivos de rechazo
        res = conn.execute(text("""
            SELECT TOP 10 ID_Cuarentena, Tabla_Origen, ID_Registro_Origen, Motivo, Valor_Recibido
            FROM MDM.Cuarentena
            WHERE Motivo LIKE '%DUPLICADO_INTERNO%' AND Tabla_Origen LIKE '%Tasa_Crecimiento_Brotes%'
            ORDER BY Fecha_Ingreso DESC
        """)).fetchall()
        
        id_origenes = []
        for row in res:
            print(f"ID_Cuarentena: {row.ID_Cuarentena}")
            print(f"ID_Registro_Origen: {row.ID_Registro_Origen}")
            print(f"Valor_Recibido: {row.Valor_Recibido}")
            print("-" * 80)
            if row.ID_Registro_Origen:
                id_origenes.append(str(row.ID_Registro_Origen))
            
        print("\n=== Detalle de los datos crudos en Bronce para estos IDs ===")
        if id_origenes:
            ids_str = ",".join(id_origenes)
            bronze_query = text(f"""
                SELECT ID_Tasa_Crecimiento, Nombre_Archivo, Fecha_Registro_Raw, Modulo_Raw, Turno_Raw, Valvula_Raw, Cama_Raw, Planta_Brote_Raw, Tallo_Raw, Cantidad_Raw
                FROM Bronce.Tasa_Crecimiento_Brotes
                WHERE ID_Tasa_Crecimiento IN ({ids_str})
            """)
            detalles = conn.execute(bronze_query).fetchall()
            for d in detalles:
                print(f"ID_Bronce: {d.ID_Tasa_Crecimiento} | Archivo: {d.Nombre_Archivo} | Fecha: {d.Fecha_Registro_Raw} | Geo: {d.Modulo_Raw}-{d.Turno_Raw}-{d.Valvula_Raw} Cama {d.Cama_Raw} | Planta-Brote: {d.Planta_Brote_Raw} | Valor: {d.Cantidad_Raw}")
                
            # Ahora busquemos si realmente existen otros registros IGUALES en Bronce
            print("\n=== Buscando las parejas (los registros originales que causaron el choque) ===")
            for d in detalles:
                parejas = conn.execute(text("""
                    SELECT ID_Tasa_Crecimiento, Nombre_Archivo, Fecha_Registro_Raw, Modulo_Raw, Turno_Raw, Valvula_Raw, Cama_Raw, Planta_Brote_Raw, Tallo_Raw, Cantidad_Raw
                    FROM Bronce.Tasa_Crecimiento_Brotes
                    WHERE Fecha_Registro_Raw = :f AND Modulo_Raw = :m AND Turno_Raw = :t AND Valvula_Raw = :v AND Cama_Raw = :c AND Planta_Brote_Raw = :p
                """), {"f": d.Fecha_Registro_Raw, "m": d.Modulo_Raw, "t": d.Turno_Raw, "v": d.Valvula_Raw, "c": d.Cama_Raw, "p": d.Planta_Brote_Raw}).fetchall()
                
                print(f"\nCoincidencias encontradas para {d.Modulo_Raw}-{d.Turno_Raw}-{d.Valvula_Raw} Cama {d.Cama_Raw} Planta {d.Planta_Brote_Raw} el {d.Fecha_Registro_Raw}:")
                for p in parejas:
                    marca = "<- (RECHAZADO)" if str(p.ID_Tasa_Crecimiento) in id_origenes else "<- (ACEPTADO EN SILVER)"
                    print(f"  ID: {p.ID_Tasa_Crecimiento} | Valor: {p.Cantidad_Raw} | Archivo: {p.Nombre_Archivo} {marca}")

except Exception as e:
    print(f"Error: {e}")
