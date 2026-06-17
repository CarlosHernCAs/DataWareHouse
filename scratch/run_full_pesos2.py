import os
import sys
import pyodbc

log_path = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\scratch\pesos_log.txt"
f_log = open(log_path, 'w')
sys.stdout = f_log
sys.stderr = f_log

# Agregar la ruta base al sys.path para importaciones absolutas
sys.path.insert(0, r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL")

from bronce.cargador import CargadorExcel
from pipeline import ejecutar_reproceso_facts

if __name__ == '__main__':
    try:
        c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
        c.autocommit = True
        c.execute("DELETE FROM Bronce.Evaluacion_Pesos")
        c.execute("TRUNCATE TABLE Silver.Fact_Evaluacion_Pesos")
        c.execute("TRUNCATE TABLE Gold.Mart_Pesos_Calibres")
        c.close()
        print("Tablas limpiadas.", flush=True)

        print("Cargando archivos Excel a Bronce...", flush=True)
        cargador = CargadorExcel()
        base_dir = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data\entrada\evaluacion_pesos"
        archivos = [os.path.join(base_dir, f) for f in os.listdir(base_dir) if f.endswith('.xlsx')]
        
        resultados = cargador.procesar_archivos(archivos)
        print("Resultados Bronce:", resultados, flush=True)

        print("Ejecutando reproceso solo para Fact_Evaluacion_Pesos...", flush=True)
        ejecutar_reproceso_facts(
            facts_solicitadas=['Fact_Evaluacion_Pesos'],
            incluir_dependencias=False,
            refrescar_gold=True,
            forzar_relectura_bronce=True
        )
        print("Terminado con exito!", flush=True)
    except Exception as e:
        print(f"ERROR FATAL: {e}", flush=True)
    finally:
        f_log.close()
