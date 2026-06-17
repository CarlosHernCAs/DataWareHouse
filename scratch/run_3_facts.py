import sys, os
sys.path.insert(0, os.path.abspath('ETL'))
from pipeline import ejecutar_reproceso_facts# Ejecutar el pipeline solo para estas 3 tablas, forzando lectura de todos los CARGADO en Bronce
ejecutar_reproceso_facts(
    facts_solicitadas=['Fact_Floracion'],
    incluir_dependencias=False,
    refrescar_gold=True,
    forzar_relectura_bronce=True
)
