import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

print("=== Archivos Fuentes unicos cargados a Bronce.Evaluacion_Vegetativa ===")
cursor.execute("""
    SELECT Nombre_Archivo_Fuente, MAX(Fecha_Inicio) as UltimaFecha, SUM(Filas_Insertadas) as TotalFilasInsertadas, COUNT(*) as VecesCargado
    FROM Auditoria.Log_Carga
    WHERE Tabla_Destino = 'Bronce.Evaluacion_Vegetativa'
    GROUP BY Nombre_Archivo_Fuente
    ORDER BY UltimaFecha DESC
""")
for row in cursor.fetchall():
    print(f"Archivo: {row[0]} | Ultima Carga: {row[1]} | Total Filas: {row[2]} | Veces: {row[3]}")

c.close()
