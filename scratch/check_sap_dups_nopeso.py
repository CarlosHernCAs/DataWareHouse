import sys
import pandas as pd
sys.path.insert(0, r'd:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL')
from config.conexion import obtener_engine
engine = obtener_engine()

pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)

with engine.connect() as conn:
    df_bronce = pd.read_sql("SELECT ID_Data_SAP, Fecha_Cosecha_Raw, Consumidor_PEP_Raw, Variedad_Codigo_Raw, Doc_Remision_Raw, Lote_Raw, Peso_Neto_Raw FROM Bronce.Data_SAP", conn)
    
    # 1. Duplicates INCLUDING Peso_Neto_Raw
    exact_dups_with_peso = df_bronce.duplicated(subset=['Fecha_Cosecha_Raw', 'Consumidor_PEP_Raw', 'Variedad_Codigo_Raw', 'Doc_Remision_Raw', 'Lote_Raw', 'Peso_Neto_Raw'], keep=False)
    
    # 2. Duplicates EXCLUDING Peso_Neto_Raw
    exact_dups_no_peso = df_bronce.duplicated(subset=['Fecha_Cosecha_Raw', 'Consumidor_PEP_Raw', 'Variedad_Codigo_Raw', 'Doc_Remision_Raw', 'Lote_Raw'], keep=False)
    
    print("--- COMPARACIÓN DE DUPLICADOS EN LA FUENTE (BRONCE) ---")
    print(f"Total de filas que son repetidas INCLUYENDO Peso Neto: {exact_dups_with_peso.sum()}")
    print(f"Total de filas que son repetidas EXCLUYENDO Peso Neto: {exact_dups_no_peso.sum()}")
    
    diff = exact_dups_no_peso.sum() - exact_dups_with_peso.sum()
    print(f"\nDiferencia: {diff} filas.")
    
    if diff > 0:
        print("\nEsto significa que hay filas que tienen el mismo Fecha, PEP, Variedad, Doc_Remision y Lote, PERO tienen distintos Pesos Netos.")
        
        # Encontrar los que son duplicados sin peso, pero que NO son duplicados con peso
        # Es decir, filas que comparten llave pero tienen peso distinto
        mask_diff = exact_dups_no_peso & ~exact_dups_with_peso
        print("Ejemplos de estas filas (Misma Remision/Lote pero DISTINTO Peso):")
        print(df_bronce[mask_diff].sort_values(by=['Doc_Remision_Raw', 'Lote_Raw']).head(20))
