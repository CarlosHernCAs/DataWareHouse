import sys
sys.path.insert(0, 'ETL')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    print("--- Matching Silver and Bronce via Geography and Date ---")
    query = text("""
        SELECT TOP 10
            s.ID_Induccion_Floral as Silver_ID,
            s.Fecha_Evento,
            s.Cantidad_Plantas_Por_Cama,
            s.Cantidad_Plantas_Con_Induccion,
            s.Pct_Plantas_Con_Induccion,
            s.Cantidad_Brotes_Totales,
            s.Cantidad_Brotes_Con_Induccion,
            s.Pct_Brotes_Con_Induccion,
            
            b.ID_Induccion_Floral as Bronce_ID,
            b.Modulo_Raw,
            b.Turno_Raw,
            b.Valvula_Raw,
            b.Cama_Raw,
            b.PlantasPorCama_Raw,
            b.PlantasConInduccion_Raw,
            b.BrotesConInduccion_Raw,
            b.BrotesConFlor_Raw,
            b.Valores_Raw
        FROM Silver.Fact_Induccion_Floral s
        -- Resolve Geography to match Bronce Modulo/Turno/Valvula/Cama
        JOIN Silver.Dim_Geografia g ON s.ID_Geografia = g.ID_Geografia
        JOIN Bronce.Induccion_Floral b ON 
            -- match date
            TRY_CAST(b.Fecha_Raw AS DATE) = s.Fecha_Evento
            -- match geo components
            AND b.Modulo_Raw = g.Modulo
            AND (b.Turno_Raw = g.Turno OR (b.Turno_Raw IS NULL AND g.Turno IS NULL))
            AND (b.Valvula_Raw = g.Valvula OR (b.Valvula_Raw IS NULL AND g.Valvula IS NULL))
            AND (b.Cama_Raw = g.Cama OR (b.Cama_Raw IS NULL AND g.Cama IS NULL))
        WHERE s.Pct_Plantas_Con_Induccion = 100.0
    """)
    res = conn.execute(query).fetchall()
    for r in res:
        print(dict(r._mapping))
