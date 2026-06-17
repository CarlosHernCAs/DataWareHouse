import requests
import json
import sys

try:
    print("Obteniendo resumen de cuarentena...")
    res_resumen = requests.get("http://localhost:8000/api/v1/cuarentena/resumen")
    if res_resumen.status_code == 200:
        print("=== Resumen de Cuarentena ===")
        print(json.dumps(res_resumen.json(), indent=2, ensure_ascii=False))
    else:
        print(f"Error {res_resumen.status_code}: {res_resumen.text}")
        
    print("\nObteniendo lista detallada de cuarentena...")
    res_list = requests.get("http://localhost:8000/api/v1/cuarentena/list")
    if res_list.status_code == 200:
        data = res_list.json()
        print("\n=== Detalle de Cuarentena ===")
        if isinstance(data, list) and len(data) > 0:
            for row in data:
                print(f"- Tabla: {row.get('tabla', 'N/A')}")
                print(f"  ID/Ref: {row.get('id_registro', 'N/A')}")
                print(f"  Motivo: {row.get('motivo_rechazo', 'N/A')}")
                print(f"  Fecha: {row.get('fecha_registro', 'N/A')}")
                print("---")
        elif isinstance(data, dict) and 'data' in data: # StandardResponse wrapper
             items = data['data']
             if items:
                 for row in items:
                    print(f"- Tabla: {row.get('tabla', 'N/A')}")
                    print(f"  ID/Ref: {row.get('id_registro', 'N/A')}")
                    print(f"  Motivo: {row.get('motivo_rechazo', 'N/A')}")
                    print(f"  Fecha: {row.get('fecha_registro', 'N/A')}")
                    print("---")
             else:
                 print("No hay registros en cuarentena en la lista detallada.")
        else:
            print(json.dumps(data, indent=2, ensure_ascii=False))
            print("No hay registros detallados o el formato es inesperado.")
    else:
        print(f"Error {res_list.status_code}: {res_list.text}")

except Exception as e:
    print(f"Excepcion al conectar: {e}")
    sys.exit(1)
