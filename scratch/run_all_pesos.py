import os
import sys
import pyodbc
from pathlib import Path

# Agregar la ruta base al sys.path para importaciones absolutas
sys.path.insert(0, r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL")

from bronce.cargador import cargar_archivo
from pipeline import ejecutar_reproceso_facts, obtener_engine

if __name__ == '__main__':
    c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
    c.autocommit = True
    c.execute("DELETE FROM Bronce.Evaluacion_Pesos")
    c.execute("TRUNCATE TABLE Silver.Fact_Evaluacion_Pesos")
    c.execute("TRUNCATE TABLE Gold.Mart_Pesos_Calibres")
    c.close()
    print("Tablas limpiadas.", flush=True)

    engine = obtener_engine()
    base_dir = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL\data\entrada\evaluacion_pesos"
    archivos = [Path(os.path.join(base_dir, f)) for f in os.listdir(base_dir) if f.endswith('.xlsx')]

    for ruta_archivo in archivos:
        print(f"Cargando {ruta_archivo.name}...", flush=True)
        resultado = cargar_archivo('evaluacion_pesos', ruta_archivo, 'Bronce.Evaluacion_Pesos', engine)
        estado = "OK" if resultado["estado"] == "OK" else "ERROR"
        print(f"[{estado}] {resultado['mensaje']}", flush=True)

    print("Ejecutando reproceso para Fact_Evaluacion_Pesos...", flush=True)
    ejecutar_reproceso_facts(
        facts_solicitadas=['Fact_Evaluacion_Pesos'],
        incluir_dependencias=False,
        refrescar_gold=True,
        forzar_relectura_bronce=True
    )
    print("Terminado con exito!", flush=True)
