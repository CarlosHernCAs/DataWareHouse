import os
import sys
import pyodbc
from pathlib import Path

# Agregar el directorio ETL al path de python para poder importar módulos
sys.path.append(str(Path(__file__).parent.parent / 'ETL'))

from config.conexion import obtener_engine
from bronce.cargador import ejecutar_carga_bronce
from pipeline import ejecutar_reproceso_facts

def main():
    print("=== Iniciando Reprocesamiento de Data_SAP y Floración ===")
    
    # 1. Limpieza de base de datos
    print("\n[1/3] Limpiando tablas Bronce y registros de cuarentena asociados...")
    conn = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
    cursor = conn.cursor()
    
    # Vaciar tablas Bronce
    print("  - Vaciando Bronce.Data_SAP...")
    cursor.execute("DELETE FROM Bronce.Data_SAP")
    print("  - Vaciando Bronce.Floracion...")
    cursor.execute("DELETE FROM Bronce.Floracion")
    
    # Limpiar Cuarentenas de estas fuentes
    print("  - Limpiando MDM.Cuarentena...")
    cursor.execute("""
        DELETE FROM MDM.Cuarentena 
        WHERE Tabla_Origen IN (
            'Bronce.Data_SAP', 
            'Bronce.Floracion', 
            'Silver.Fact_Cosecha_SAP', 
            'Silver.Fact_Floracion'
        )
    """)
    
    # Limpiar aprendizaje fallido de geografías nulas
    print("  - Limpiando aprendizaje de geografías nulas en MDM.Catalogo_Geografia...")
    cursor.execute("DELETE FROM MDM.Catalogo_Geografia WHERE Es_Activa = 0 AND Fundo = 'ARANDANO ACP' AND Sector IS NULL AND Modulo IS NULL")
    
    conn.commit()
    conn.close()
    print("  [OK] Limpieza de BD completada.")
    
    # 2. Ejecutar carga de Bronce para leer los Excels corregidos
    print("\n[2/3] Ejecutando la carga de archivos corregidos desde Excel a Bronce...")
    # Cambiar de directorio al directorio de ETL para que las rutas relativas de carpetas de entrada funcionen
    os.chdir(str(Path(__file__).parent.parent / 'ETL'))
    resultados_bronce = ejecutar_carga_bronce()
    print(f"  [OK] Carga de Bronce finalizada. Archivos procesados: {len(resultados_bronce)}")
    for r in resultados_bronce:
        print(f"    - {r.get('archivo')}: {r.get('mensaje')}")
        
    # 3. Reprocesar Facts en Silver y actualizar Gold
    print("\n[3/3] Ejecutando reprocesamiento de hechos en Silver y refrescando Gold...")
    ejecutar_reproceso_facts(
        facts_solicitadas=['Fact_Cosecha_SAP', 'Fact_Floracion'],
        incluir_dependencias=True,
        refrescar_gold=True,
        forzar_relectura_bronce=True
    )
    print("\n=== ¡Proceso finalizado correctamente! ===")

if __name__ == '__main__':
    main()
