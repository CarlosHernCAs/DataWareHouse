import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    rows = conn.execute(text(
        'SELECT ID_Induccion_Floral, PlantasPorCama_Raw, PlantasConInduccion_Raw, '
        'BrotesConInduccion_Raw, BrotesConFlor_Raw, Valores_Raw '
        'FROM Bronce.Induccion_Floral'
    )).fetchall()


def parse_raw(s):
    if not s:
        return {}
    result = {}
    for part in str(s).split('|'):
        part = part.strip()
        if '=' in part:
            k, v = part.split('=', 1)
            result[k.strip()] = v.strip()
    return result


def a_int(v):
    if v is None:
        return None
    s = str(v).strip()
    if not s or s in ('nan', 'None', ''):
        return None
    try:
        f = float(s)
        i = int(f)
        return None if i < 0 else i
    except Exception:
        return None


rechazados_planta = []
silenciosos = 0
ok_silenciosos_todos_cero = 0
ok_proxy = 0
ok_plantasvalidas = 0

for r in rows:
    id_, ppc, pci, bci, bcf, vals = r
    valores_dict = parse_raw(vals)

    plantas_por_cama = a_int(ppc)
    plantas_con_induccion = a_int(pci)
    brotes_con_induccion = a_int(bci)
    brotes_con_flor = a_int(bcf)

    # Simular la logica de brotes_totales del fact
    bt_raw = None  # BrotesTotales no es columna en cols_raw
    bt_vals = a_int(valores_dict.get('BrotesTotales_Raw'))
    bt_peval = a_int(valores_dict.get('pEvaluadas_Raw'))
    bt_fallback = a_int(bci)  # BrotesConInduccion_Raw como ultimo fallback

    brotes_totales = bt_raw
    if brotes_totales is None or brotes_totales == 0:
        brotes_totales = bt_vals
    if brotes_totales is None or brotes_totales == 0:
        brotes_totales = bt_peval
    if brotes_totales is None or brotes_totales == 0:
        brotes_totales = bt_fallback

    if plantas_por_cama is None or plantas_por_cama <= 0:
        todos_cero = all(
            v is None or v == 0
            for v in [plantas_con_induccion, brotes_con_induccion, brotes_con_flor, brotes_totales]
        )
        if todos_cero:
            ok_silenciosos_todos_cero += 1
        elif brotes_totales and brotes_totales > 0:
            ok_proxy += 1
        else:
            rechazados_planta.append({
                'id': id_,
                'ppc': ppc,
                'pci': pci,
                'bci': bci,
                'bcf': bcf,
                'brotes_totales': brotes_totales,
                'bt_vals': bt_vals,
                'bt_peval': bt_peval,
                'bt_fallback': bt_fallback,
                'pci_parsed': plantas_con_induccion,
                'bci_parsed': brotes_con_induccion,
                'bcf_parsed': brotes_con_flor,
                'vals': vals[:150] if vals else None
            })
    else:
        ok_plantasvalidas += 1

print(f'Total rows: {len(rows)}')
print(f'Silenciosos (todos_cero=True): {ok_silenciosos_todos_cero}')
print(f'Proxy OK (plantas=brotes_totales>0): {ok_proxy}')
print(f'Plantas validas directamente: {ok_plantasvalidas}')
print(f'Rechazados PlantasPorCama: {len(rechazados_planta)}')
print()
if rechazados_planta:
    print('Ejemplos rechazados:')
    for x in rechazados_planta[:8]:
        print(f'  ID={x["id"]} ppc={repr(x["ppc"])} bci={repr(x["bci"])} bcf={repr(x["bcf"])}')
        print(f'    bt={x["brotes_totales"]} bt_vals={x["bt_vals"]} bt_peval={x["bt_peval"]}')
        print(f'    pci_parsed={x["pci_parsed"]} bci_parsed={x["bci_parsed"]} bcf_parsed={x["bcf_parsed"]}')
        print(f'    vals: {x["vals"]}')
