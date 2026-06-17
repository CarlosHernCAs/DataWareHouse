import json
from nucleo.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.connect() as conn:
    result = conn.execute(text("SELECT Fecha_Evento, Tipo, Mensaje FROM Control.Corrida_Evento WHERE ID_Corrida = '962e3a71-c681-4a7b-bb1a-e449824fe844' ORDER BY Fecha_Evento"))
    for row in result:
        print(f"[{row.Tipo}] {row.Fecha_Evento} - {row.Mensaje}")
