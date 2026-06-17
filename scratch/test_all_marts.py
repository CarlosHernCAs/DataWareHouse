import sys
import os

# Añadir el directorio ETL al path de Python para poder importar los módulos del ETL
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../ETL")))

from config.conexion import obtener_engine
from gold.marts import refrescar_todos_los_marts

def main():
    print("=== Iniciando validación de todos los Marts en Vistas ===")
    try:
        engine = obtener_engine()
        resumen = refrescar_todos_los_marts(engine)
        print("\n=== Resultados del Refresco de Vistas ===")
        for mart, count in resumen.items():
            print(f"{mart:35}: {count} filas")
        print("\n[ÉXITO] Todas las vistas de Gold compilaron y retornaron datos correctamente.")
    except Exception as e:
        print(f"\n[ERROR] Error al refrescar o validar las vistas: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
