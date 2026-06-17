import sys, os
sys.path.insert(0, os.path.abspath('ETL'))
import bronce.cargador as cargador
cargador.ejecutar_carga_bronce()
