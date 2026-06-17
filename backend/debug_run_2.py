from nucleo.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    # get the latest run
    run = conn.execute(text("SELECT TOP 1 Id_Corrida, Estado, Mensaje_Final FROM Control.Corrida ORDER BY Fecha_Inicio DESC")).fetchone()
    if run:
        print(f"LATEST RUN: {run.Id_Corrida} [{run.Estado}]")
        print(f"Mensaje Final: {run.Mensaje_Final}")
        print("--- EVENTS ---")
        events = conn.execute(text("SELECT Fecha_Evento, Tipo, Mensaje FROM Control.Corrida_Evento WHERE Id_Corrida = :id ORDER BY Fecha_Evento"), {"id": run.Id_Corrida})
        for e in events:
            print(f"[{e.Tipo}] {e.Mensaje}")
    else:
        print("No runs found.")
