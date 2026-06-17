import pyodbc
c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

print("=== Archivos en Bronce.Evaluacion_Vegetativa ===")
cursor.execute("SELECT Nombre_Archivo, COUNT(*), MIN(Fecha_Raw), MAX(Fecha_Raw) FROM Bronce.Evaluacion_Vegetativa GROUP BY Nombre_Archivo")
for row in cursor.fetchall():
    print(f"Archivo: {row[0]} | Filas: {row[1]} | Min Fecha: {row[2]} | Max Fecha: {row[3]}")

print("\n=== Años en Fecha_Raw ===")
cursor.execute("SELECT LEFT(Fecha_Raw, 4) as Anio, COUNT(*) FROM Bronce.Evaluacion_Vegetativa GROUP BY LEFT(Fecha_Raw, 4) ORDER BY Anio")
for row in cursor.fetchall():
    print(f"Año: {row[0]} | Filas: {row[1]}")

print("\n=== Filas en Silver por ID_Campana ===")
cursor.execute("SELECT ID_Campana, COUNT(*) FROM Silver.Fact_Evaluacion_Vegetativa GROUP BY ID_Campana ORDER BY ID_Campana")
for row in cursor.fetchall():
    print(f"Campana: {row[0]} | Filas: {row[1]}")

print("\n=== Filas en Silver por Estado_DQ ===")
cursor.execute("SELECT Estado_DQ, COUNT(*) FROM Silver.Fact_Evaluacion_Vegetativa GROUP BY Estado_DQ ORDER BY Estado_DQ")
for row in cursor.fetchall():
    print(f"Estado DQ: {row[0]} | Filas: {row[1]}")

print("\n=== ¿Cuántos registros en Cuarentena para Evaluacion_Vegetativa? ===")
cursor.execute("SELECT Motivo, COUNT(*) FROM MDM.Cuarentena WHERE Tabla_Origen = 'Bronce.Evaluacion_Vegetativa' GROUP BY Motivo")
for row in cursor.fetchall():
    print(f"Motivo: {row[0]} | Filas: {row[1]}")

c.close()
