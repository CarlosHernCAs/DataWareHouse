import pandas as pd
from pathlib import Path

pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)

file_path = Path("ETL/data/procesados/induccion_floral/Inducción Floral - Floración Campaña 2025_20260604_121652.xlsx")
if not file_path.exists():
    import glob
    matches = glob.glob("ETL/data/procesados/induccion_floral/Inducci*n Floral - Floraci*n*.xlsx")
    if matches:
        file_path = Path(matches[0])

df = pd.read_excel(file_path, sheet_name='BD Inducción')

# Find columns by keyword to be safe
col_cama = [c for c in df.columns if "cama" in str(c).lower()][0]
col_total_plants = [c for c in df.columns if "plantas por cama" in str(c).lower()][0]
col_ind_plants = [c for c in df.columns if "plantas con" in str(c).lower()][0]
col_pct_ind_plants = [c for c in df.columns if "%plantas" in str(c).lower()][0]

cols_to_print = ['Fecha', 'Módulo', 'Turno', 'Válvula', col_cama, 'Variedad', col_total_plants, col_ind_plants, col_pct_ind_plants]
print(df[cols_to_print].iloc[285:296])
