import os
import sys

# Agregar la ruta base al sys.path para importaciones absolutas
sys.path.insert(0, r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL")

from pipeline import ejecutar_reproceso_facts

if __name__ == '__main__':
    print("Ejecutando reproceso solo para Fact_Evaluacion_Pesos...")
    ejecutar_reproceso_facts(
        facts_solicitadas=['Fact_Evaluacion_Pesos'],
        incluir_dependencias=False,
        refrescar_gold=True,
        forzar_relectura_bronce=True
    )
    print("Terminado con exito!")
