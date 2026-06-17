import sys
import os
from sqlalchemy import text

# Agregar directorio actual a sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.conexion import obtener_engine

def crear_indices():
    engine = obtener_engine()
    
    indices = [
        {
            "nombre": "IX_Dim_Geografia_Lookup_Fisico",
            "tabla": "Silver.Dim_Geografia",
            "ddl": """
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Dim_Geografia_Lookup_Fisico' AND object_id = OBJECT_ID('Silver.Dim_Geografia'))
                CREATE NONCLUSTERED INDEX IX_Dim_Geografia_Lookup_Fisico
                ON Silver.Dim_Geografia (ID_Modulo_Catalogo, ID_Turno_Catalogo, ID_Valvula_Catalogo, Es_Vigente)
                INCLUDE (ID_Geografia, ID_Fundo_Catalogo, ID_Sector_Catalogo, Es_Test_Block);
            """
        }
    ]
    
    with engine.begin() as conn:
        print("Iniciando creación de índice corregido...")
        for idx in indices:
            print(f"Verificando/Creando índice: {idx['nombre']} en {idx['tabla']}...")
            try:
                conn.execute(text(idx["ddl"]))
                print(f"  [OK] Índice {idx['nombre']} verificado o creado correctamente.")
            except Exception as e:
                print(f"  [ERROR] Falló la creación del índice {idx['nombre']}: {e}")
                
    print("Creación de índices completada.")

if __name__ == "__main__":
    crear_indices()
