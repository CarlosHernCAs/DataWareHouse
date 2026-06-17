import os
import sys
import pyodbc

# Agregar la ruta base al sys.path para importaciones absolutas
sys.path.insert(0, r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL")

from pipeline import ejecutar_carga_bronce, ejecutar_reproceso_facts

if __name__ == '__main__':
    c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
    c.autocommit = True
    c.execute("DELETE FROM Bronce.Evaluacion_Pesos")
    c.execute("TRUNCATE TABLE Silver.Fact_Evaluacion_Pesos")
    c.execute("TRUNCATE TABLE Gold.Mart_Pesos_Calibres")
    c.close()
    print("Tablas limpiadas.", flush=True)

    print("Cargando archivos Excel a Bronce (ignora otras carpetas porque seran rapidas o fallaran rapido)...", flush=True)
    # Move huge file to desktop temporarily to avoid hanging
    bad_file = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data\entrada\BI_Cosecha3_20260523_232732_20260525_093354.xlsx"
    desktop_dest = r"C:\Users\chernandez\Desktop\historico\BI_Cosecha3_Temp.xlsx"
    moved = False
    if os.path.exists(bad_file):
        os.rename(bad_file, desktop_dest)
        moved = True

    try:
        ejecutar_carga_bronce()
        print("Carga a bronce finalizada.", flush=True)

        print("Ejecutando reproceso solo para Fact_Evaluacion_Pesos...", flush=True)
        ejecutar_reproceso_facts(
            facts_solicitadas=['Fact_Evaluacion_Pesos'],
            incluir_dependencias=False,
            refrescar_gold=True,
            forzar_relectura_bronce=True
        )
        print("Terminado con exito!", flush=True)
    finally:
        if moved:
            os.rename(desktop_dest, bad_file)
