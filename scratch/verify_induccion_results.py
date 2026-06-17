import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("=== VERIFICACION FINAL DEL PIPELINE ===\n")

    # 1. Induccion Floral - Bronce
    q = text("SELECT Estado_Carga, COUNT(1) as N FROM Bronce.Induccion_Floral GROUP BY Estado_Carga ORDER BY N DESC")
    print("Bronce.Induccion_Floral por Estado_Carga:")
    for r in conn.execute(q).fetchall():
        print(f"  {r.Estado_Carga}: {r.N:,}")

    # 2. Induccion Floral - Silver
    q2 = text("SELECT COUNT(1) as N FROM Silver.Fact_Induccion_Floral")
    n_silver = conn.execute(q2).scalar()
    print(f"\nSilver.Fact_Induccion_Floral total: {n_silver:,}")

    # 3. Induccion Floral - Bronce nuevo archivo con estructura correcta
    q3 = text("""
        SELECT TOP 3 Nombre_Archivo, Fecha_Raw, Modulo_Raw, Turno_Raw, Valvula_Raw,
               PlantasPorCama_Raw, PlantasConInduccion_Raw, BrotesConInduccion_Raw, BrotesConFlor_Raw,
               LEFT(Valores_Raw, 100) as Valores_Raw_truncado
        FROM Bronce.Induccion_Floral
        WHERE Nombre_Archivo = 'Reporte Inducci' + NCHAR(243) + 'n Floral.xlsx'
        ORDER BY ID_Induccion_Floral ASC
    """)
    try:
        rows3 = conn.execute(q3).fetchall()
        print("\nMuestra del nuevo archivo en Bronce.Induccion_Floral:")
        for r in rows3:
            print(f"  Archivo: {r.Nombre_Archivo}")
            print(f"  Fecha: {r.Fecha_Raw} | Modulo: {r.Modulo_Raw} | Turno: {r.Turno_Raw} | Valvula: {r.Valvula_Raw}")
            print(f"  PlantasPorCama: {r.PlantasPorCama_Raw} | PlantasConInduccion: {r.PlantasConInduccion_Raw}")
            print(f"  BrotesConInduccion: {r.BrotesConInduccion_Raw} | BrotesConFlor: {r.BrotesConFlor_Raw}")
            print(f"  Valores_Raw: {r.Valores_Raw_truncado}")
            print("-" * 50)
    except Exception as e:
        # Fallback sin NCHAR
        q3b = text("""
            SELECT TOP 3 Nombre_Archivo, Fecha_Raw, Modulo_Raw,
                   PlantasPorCama_Raw, PlantasConInduccion_Raw, BrotesConInduccion_Raw, BrotesConFlor_Raw
            FROM Bronce.Induccion_Floral
            WHERE Estado_Carga = 'CARGADO'
            ORDER BY ID_Induccion_Floral ASC
        """)
        rows3b = conn.execute(q3b).fetchall()
        print("\nMuestra CARGADO en Bronce.Induccion_Floral:")
        for r in rows3b:
            print(f"  Archivo: {r.Nombre_Archivo} | Fecha: {r.Fecha_Raw} | Modulo: {r.Modulo_Raw}")
            print(f"  PlantasPorCama: {r.PlantasPorCama_Raw} | PlantasConInduccion: {r.PlantasConInduccion_Raw}")
            print(f"  BrotesConInduccion: {r.BrotesConInduccion_Raw} | BrotesConFlor: {r.BrotesConFlor_Raw}")
            print("-" * 50)

    # 4. Clima
    q4 = text("SELECT COUNT(1) as N FROM Silver.Fact_Telemetria_Clima")
    n_clima = conn.execute(q4).scalar()
    print(f"\nSilver.Fact_Telemetria_Clima total: {n_clima:,}")

    # 5. Porcentajes > 100% en Induccion Floral (el bug original)
    q5 = text("""
        SELECT
            SUM(CASE WHEN Pct_Brotes_Con_Induccion > 100 THEN 1 ELSE 0 END) AS pct_induccion_gt_100,
            SUM(CASE WHEN Pct_Brotes_Con_Flor > 100 THEN 1 ELSE 0 END) AS pct_flor_gt_100,
            SUM(CASE WHEN Pct_Plantas_Con_Induccion > 100 THEN 1 ELSE 0 END) AS pct_plantas_gt_100,
            COUNT(1) AS total
        FROM Silver.Fact_Induccion_Floral
    """)
    r5 = conn.execute(q5).fetchone()
    print(f"\nVerificacion porcentajes > 100% en Silver.Fact_Induccion_Floral:")
    print(f"  Pct_Brotes_Con_Induccion > 100%: {r5.pct_induccion_gt_100}")
    print(f"  Pct_Brotes_Con_Flor > 100%:      {r5.pct_flor_gt_100}")
    print(f"  Pct_Plantas_Con_Induccion > 100%: {r5.pct_plantas_gt_100}")
    print(f"  Total filas Silver:               {r5.total:,}")
