import sys
import os
import re
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.conexion import obtener_engine

def buscar_formulas_faltantes():
    engine = obtener_engine()
    
    query = text("""
        SELECT 
            s.name AS SchemaName,
            v.name AS ViewName,
            m.definition AS ViewDefinition
        FROM sys.views v
        INNER JOIN sys.schemas s ON v.schema_id = s.schema_id
        INNER JOIN sys.sql_modules m ON v.object_id = m.object_id
        WHERE s.name IN ('Silver', 'Gold', 'MDM')
        ORDER BY s.name, v.name
    """)
    
    with engine.connect() as conn:
        vistas = conn.execute(query).fetchall()
        print(f"Buscando placeholders y comentarios de fórmulas en {len(vistas)} vistas...\n")
        
        placeholders_encontrados = []
        
        for esquema, nombre, definicion in vistas:
            # Buscar comentarios de TODO, PENDIENTE, FORMULA, CALCULO
            comentarios = re.findall(r'(--.*?(?:TODO|PENDIENTE|FORMULA|CALCULO|COMPLETAR|VERIFICAR).*?)\n', definicion, re.IGNORECASE)
            
            # Buscar columnas proyectadas como NULL AS o constantes AS que parezcan placeholders
            # Ej: NULL AS Columna, 0 AS Columna, 'PENDIENTE' AS Columna, etc.
            # Ignoramos si es un cast tipo CAST(NULL AS INT) AS Columna
            null_as_matches = re.findall(r'(?:NULL|0|\'\'|\'PENDIENTE\')\s+AS\s+\[?(\w+)\]?', definicion, re.IGNORECASE)
            
            # También buscar CAST(NULL AS ...) AS Columna
            cast_null_as = re.findall(r'CAST\s*\(\s*NULL\s+AS\s+[^)]+\)\s+AS\s+\[?(\w+)\]?', definicion, re.IGNORECASE)
            todos_placeholders = list(set(null_as_matches + cast_null_as))
            
            if comentarios or todos_placeholders:
                placeholders_encontrados.append({
                    "vista": f"{esquema}.{nombre}",
                    "comentarios": comentarios,
                    "placeholders": todos_placeholders,
                    "def": definicion
                })
                
        if not placeholders_encontrados:
            print("No se encontraron comentarios de TODO o columnas fijas NULL/0 en las vistas.")
        else:
            for item in placeholders_encontrados:
                print(f"==================================================")
                print(f"VISTA: {item['vista']}")
                print(f"==================================================")
                if item['comentarios']:
                    print("Comentarios sospechosos:")
                    for c in item['comentarios']:
                        print(f"  * {c.strip()}")
                if item['placeholders']:
                    print("Posibles columnas placeholders (NULL/0/fijo):")
                    for p in item['placeholders']:
                        print(f"  - {p}")
                print("\nEstracto del DDL (primeras 30 líneas o donde aparecen coincidencias):")
                lines = item['def'].split('\n')
                # Mostrar líneas que contienen la coincidencia
                for i, l in enumerate(lines):
                    l_lower = l.lower()
                    if any(p.lower() in l_lower for p in item['placeholders']) or any(x in l_lower for x in ['todo', 'pendiente', 'formula', 'calculo', 'null as']):
                        start = max(0, i - 2)
                        end = min(len(lines), i + 3)
                        print(f"--- Líneas {start+1} a {end} ---")
                        for idx in range(start, end):
                            print(f"{idx+1:3d}: {lines[idx]}")
                        print("-" * 30)
                print("\n")

if __name__ == "__main__":
    buscar_formulas_faltantes()
