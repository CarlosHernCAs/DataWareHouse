import sys
import pandas as pd
sys.path.insert(0, r'd:\Proyecto2026\ACP_DWH\ACP Proyecciones\ETL')
from config.conexion import obtener_engine
engine = obtener_engine()
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)

with engine.connect() as conn:
    df_cuar = pd.read_sql("SELECT * FROM MDM.Cuarentena WHERE Motivo LIKE '%duplicado%' AND (Tabla_Origen LIKE '%SAP%' OR Campo_Origen LIKE '%SAP%')", conn)
    ids = df_cuar['ID_Registro_Origen'].dropna().astype(int).tolist()
    
    if ids:
        df_bronce = pd.read_sql("SELECT ID_Data_SAP, Fecha_Cosecha_Raw, Consumidor_PEP_Raw, Variedad_Codigo_Raw, Doc_Remision_Raw, Lote_Raw, Peso_Neto_Raw FROM Bronce.Data_SAP", conn)
        
        df_cuar_bronce = df_bronce[df_bronce['ID_Data_SAP'].isin(ids)]
        
        # Now let's group by the columns that define the "grain" from Bronce's perspective to see if they are EXACT duplicates
        # We will count how many exact duplicates exist across all these fields
        exact_dups = df_bronce.duplicated(subset=['Fecha_Cosecha_Raw', 'Consumidor_PEP_Raw', 'Variedad_Codigo_Raw', 'Doc_Remision_Raw', 'Lote_Raw', 'Peso_Neto_Raw'], keep=False)
        
        print(f"Total exact identical rows in Bronce (same Date, PEP, Variety, Remision, Lote, Peso): {exact_dups.sum()}")
        
        # Are the quarantined records part of these exact duplicates?
        quarantined_are_exact = df_bronce[exact_dups]['ID_Data_SAP'].isin(ids).sum()
        print(f"Of the exact identical rows in Bronce, {quarantined_are_exact} are in quarantine.")
        
        if quarantined_are_exact < len(ids):
            print(f"\nThis means {len(ids) - quarantined_are_exact} quarantine records are NOT exact duplicates in the source!")
            print("They were sent to quarantine because the ETL unique key caused a collision on DIFFERENT SAP records.")
            
            # Show some examples of records that collided in ETL but are different in SAP
            non_exact_cuar = df_cuar_bronce[~df_cuar_bronce['ID_Data_SAP'].isin(df_bronce[exact_dups]['ID_Data_SAP'])]
            print("\nExample of SAP records that collided in grain but have different Lotes/Remisiones:")
            print(non_exact_cuar.head(10))
