# Notas para revisión posterior

## 1) Migración a `calamine` (pendiente, NO urgente)

**Beneficio:** lector de Excel ~10x más rápido que openpyxl.
- `Conteo Historico.xlsx` (646k filas): 30-60s → 3-8s
- `Tasa de Crecimiento Historica.xlsx` (1M+ filas): 2-5 min → 15-30s
- `_detectar_hoja_y_header` (escanea todas las hojas): 3-5s → 0.3s

**NO acelera:** dedup/MERGE en Silver (eso es pandas/SQL puro).

**Pasos:**
```bash
pip install python-calamine
```
Luego en `ETL/bronce/cargador.py`, reemplazo global:
```
engine='openpyxl'  →  engine='calamine'
```
~10 ocurrencias. API compatible (`dtype=str`, `sheet_name`, `header`, `nrows`, `ExcelFile.sheet_names`).

**Cuándo hacerlo:** después de estabilizar el ETL (NO durante un run activo).

---

## 2) BUG RESUELTO ✅: Fact_Conteo_Fenologico fallaba en MERGE

**Fix aplicado:** `ETL/silver/facts/fact_conteo_fenologico.py` línea 263-269.

**Causa raíz:** la columna `Punto` se construía como string (`str(numpy.nan).strip() = 'nan'` literal cuando `Punto_Raw` venía NULL). El check `is not None` no detecta `numpy.nan`. Al insertarse en `#Temp_ConteoFenologico`, el inferidor de tipos veía el primer valor string y creaba la columna como `NVARCHAR(4000)`. En el MERGE, SQL Server intentaba castear `'nan' → int` (porque `Silver.Fact_Conteo_Fenologico.Punto` es `INT NULL`) y fallaba con error 22018.

**Fix:** se reemplazó el manejo manual del string por una llamada a `_a_entero_nulo()`, que ya existía en el módulo y trata correctamente NaN/None/empty/'nan'/'NULL'. Si todo falla, default `0` (compatible con la convención previa).

**Validación:** 10/10 casos (nan, None, '', 'nan', 'NULL', whitespace, '0', '12.0', int, float) retornan los valores esperados.

---

## 2-BIS) Diagnóstico original (referencia histórica)

**Error:**
```
pyodbc.DataError: ('22018', "Conversion failed when converting the nvarchar value 'nan' to data type int.")
```

**Contexto:**
- `[12:05:34]` arranca carga
- `[12:10:57]` dedup descarta 1,135,097 filas (esperado por el dump BD+Hoja1)
- `[13:13:31]` falla el MERGE a `Silver.Fact_Conteo_Fenologico` desde `#Temp_ConteoFenologico`

**Diagnóstico:**
El error `nvarchar value 'nan'` significa que en alguna columna entera (`ID_Geografia`, `ID_Tiempo`, `ID_Variedad`, `ID_Personal`, `ID_Estado_Fenologico`, `Cantidad_Organos`, `Plantas_Productivas`, `Plantas_No_Productivas`, `ID_Campana`) hay literalmente el string `'nan'`. Eso indica:
- Una columna `float` con NaN se castó a `str` antes de insertarse → `'nan'` literal.
- Sucede típicamente con `df['col'].astype(str)` cuando hay NaN.

**Sospechosos en el flujo:**
1. `ETL/silver/facts/fact_conteo_fenologico.py:327` → `cargar_fact_conteo_fenologico`
2. `ETL/silver/facts/_base_processor.py:604` → `_ejecutar_insercion_masiva_segura`
3. Algún `astype(str)` sin un `.where(df.notna(), None)` previo, o `fillna('nan')` accidental.

**Fix probable (a confirmar inspeccionando código):**
En el preparado del payload antes de `_ejecutar_insercion_masiva_segura`, reemplazar NaN por None:
```python
for col in cols_int:
    payload[col] = payload[col].where(payload[col].notna(), None)
```
o usar `pd.Int64` (nullable int) en vez de `float` + `astype(str)`.

**Columnas a auditar:** las 9 enteras del MERGE arriba listadas. Es muy probable que `ID_Campana` o `ID_Personal` sean las culpables porque suelen tener NULLs cuando el MDM no resuelve.

**Para reproducir:**
```python
# En la sesión Python del ETL, antes del MERGE:
print(payload.dtypes)
print(payload.isna().sum())  # cuántos NaN por columna
print((payload.astype(str) == 'nan').sum())  # cuántos quedaron como 'nan'
```

**Workaround temporal:** si urge cargar, en `_base_processor.py` antes de bulk insert:
```python
payload = payload.replace({'nan': None, 'NaN': None, '<NA>': None})
```
Pero esto NO es la solución correcta — solo enmascara el problema.
