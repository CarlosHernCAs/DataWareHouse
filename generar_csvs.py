import csv
import random
from datetime import datetime, timedelta

def generar_fact_proyecciones(num_filas=1000):
    escenarios = ["Optimista", "Pesimista", "Base"]
    with open("prueba_Fact_Proyecciones.csv", mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["ID_Proyeccion", "Escenario", "Fecha", "Valor", "Comentario"])
        
        for i in range(1, num_filas + 1):
            escenario = random.choice(escenarios)
            fecha = (datetime(2026, 1, 1) + timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d")
            
            # Inyectar algunos errores a propósito (~5% de probabilidad)
            rand_val = random.random()
            if rand_val < 0.02:
                valor = round(random.uniform(-5000, -1), 2)  # Negativo (Error)
                comentario = "Ajuste manual (Error provocado)"
            elif rand_val < 0.04:
                valor = ""  # Nulo (Error)
                comentario = "Falta valor"
            elif rand_val < 0.05:
                valor = "TextoInvalido"  # String (Error)
                comentario = "Error tipografico"
            else:
                valor = round(random.uniform(100, 500000), 2)  # Valido
                comentario = f"Ajuste valido para {escenario}"
                
            writer.writerow([i, escenario, fecha, valor, comentario])
            
def generar_fact_ciclo_poda(num_filas=1000):
    lotes = [f"LOTE-{str(i).zfill(3)}" for i in range(1, 51)]
    tipos_poda = ["Formacion", "Produccion", "Rejuvenecimiento", "Sanidad"]
    
    with open("prueba_Fact_Ciclo_Poda.csv", mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["ID_Poda", "Lote", "Fecha_Poda", "Tipo_Poda", "Costo", "Horas_Hombre"])
        
        for i in range(1, num_filas + 1):
            lote = random.choice(lotes)
            tipo = random.choice(tipos_poda)
            fecha = (datetime(2026, 1, 1) + timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d")
            
            # Inyectar errores (~5%)
            rand_val = random.random()
            if rand_val < 0.02:
                costo = round(random.uniform(-1000, -10), 2)  # Costo Negativo
                horas = random.randint(1, 100)
            elif rand_val < 0.04:
                costo = round(random.uniform(100, 5000), 2)
                horas = -5  # Horas negativas
            elif rand_val < 0.05:
                costo = "N/A"
                horas = ""
            else:
                costo = round(random.uniform(50, 2000), 2)
                horas = random.randint(1, 120)
                
            writer.writerow([i, lote, fecha, tipo, costo, horas])

if __name__ == "__main__":
    generar_fact_proyecciones(2500)
    print("Generado prueba_Fact_Proyecciones.csv con 2500 filas")
    
    generar_fact_ciclo_poda(2500)
    print("Generado prueba_Fact_Ciclo_Poda.csv con 2500 filas")
