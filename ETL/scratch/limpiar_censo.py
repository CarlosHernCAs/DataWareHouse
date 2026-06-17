import sys
sys.path.insert(0, '.')
from config.conexion import obtener_engine
from sqlalchemy import text

engine = obtener_engine()
with engine.begin() as con:
    con.execute(text("DELETE FROM Bronce.Censo_Plantas"))
    con.execute(text("DELETE FROM Silver.Fact_Censo_Plantas"))
    con.execute(text("DELETE FROM MDM.Cuarentena WHERE Tabla_Origen = 'Bronce.Censo_Plantas'"))

print("Limpieza completada correctamente.")
