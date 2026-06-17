import pyodbc

c = pyodbc.connect('DRIVER={SQL Server};SERVER=.;DATABASE=ACP_DataWarehose_Proyecciones;Trusted_Connection=yes;')
cursor = c.cursor()

print("=== Historial de cargas de Fact_Evaluacion_Vegetativa ===")
cursor.execute("""
    SELECT TOP 20 ID_Log_Carga, Tabla_Destino, Nombre_Archivo_Fuente, Fecha_Inicio, Estado_Proceso, Filas_Leidas, Filas_Insertadas, Filas_Rechazadas
    FROM Auditoria.Log_Carga
    WHERE Tabla_Destino LIKE '%Evaluacion_Vegetativa%' OR Nombre_Archivo_Fuente LIKE '%vegetativa%'
    ORDER BY Fecha_Inicio DESC
""")
for row in cursor.fetchall():
    print(f"ID: {row[0]} | Tabla: {row[1]} | Archivo: {row[2]} | Fecha: {row[3]} | Estado: {row[4]} | Leidas: {row[5]} | Insertadas: {row[6]} | Rechazadas: {row[7]}")

c.close()
