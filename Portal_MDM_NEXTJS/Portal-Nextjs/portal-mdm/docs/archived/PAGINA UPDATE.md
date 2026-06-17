# PROPUESTA OFICIAL

# AgroData Control Center

## 1. Visión del Producto

AgroData Control Center es una plataforma web diseñada para centralizar el monitoreo, gobierno y supervisión de los activos de datos de la organización.

El sistema permitirá controlar:

* Procesos ETL
* Calidad de Datos
* Data Warehouse
* Catálogos Maestros
* Alertas Operativas
* Auditoría y Trazabilidad

Todo desde una única interfaz moderna orientada a operaciones.

---

# 2. Filosofía de Diseño

## Concepto

Centro de Operaciones de Datos.

No es un ERP.

No es un CRUD.

No es un sistema transaccional.

Es una plataforma de observabilidad y gobierno de datos.

---

# 3. Principios de Diseño

## Prioridad 1

Estado operativo visible en menos de 10 segundos.

## Prioridad 2

Ningún usuario debe ingresar a SQL Server para monitorear procesos.

## Prioridad 3

Toda información crítica debe encontrarse en máximo 3 clics.

## Prioridad 4

Las alertas importantes deben ser visibles inmediatamente.

## Prioridad 5

Diseño corporativo y atemporal.

---

# 4. Identidad Visual

## Estilo

DataOps Enterprise Platform

Inspiración:

* Azure Portal
* Databricks
* Grafana
* Microsoft Fabric
* Elastic Kibana

---

# 5. Paleta de Colores

## Fondo Principal

#0F172A

## Tarjetas

#1E293B

## Texto Principal

#F8FAFC

## Texto Secundario

#94A3B8

## Azul Corporativo

#2563EB

## Verde Operativo

#22C55E

## Amarillo Advertencia

#F59E0B

## Rojo Crítico

#EF4444

---

# 6. Tipografía

Fuente principal:

Inter

Jerarquía:

H1 = 32px

H2 = 24px

H3 = 18px

Texto = 14px

Indicadores KPI = 36px

Peso recomendado:

500

600

700

---

# 7. Estructura General

Layout permanente.

```text
┌──────────────────────────────────────────────┐
│ Header Global                                │
├──────────────┬───────────────────────────────┤
│ Sidebar      │ Área de Trabajo               │
└──────────────┴───────────────────────────────┘
```

---

# 8. Header Global

Elementos:

* Logo
* Nombre plataforma
* Estado sistema
* Alertas activas
* Usuario conectado

Ejemplo:

🟢 Plataforma Operativa

🔴 1 Crítica

🟡 3 Advertencias

---

# 9. Sidebar

## OPERACIONES

Dashboard

Monitor ETL

Calidad de Datos

Data Warehouse

## GOBIERNO

Catálogos

Alertas

Bitácora

## ADMINISTRACIÓN

Configuración

---

# 10. Dashboard Ejecutivo

## Objetivo

Mostrar la salud completa del ecosistema.

### Componentes

Estado General

Actividad Reciente

Alertas Activas

Tendencia ETL

Estado DWH

Calidad de Datos

---

## Vista Propuesta

```text
Estado General

🟢 ETL
🟢 DWH
🟡 Calidad
🔴 Alertas

────────────────────

Actividad Reciente

08:00 ETL Producción
08:02 ETL Costos
08:05 Error Meteorología

────────────────────

Alertas Activas

1 crítica
3 advertencias
```

---

# 11. Monitor ETL

## Objetivo

Visualizar el flujo completo de ejecución.

### Información

Nombre ETL

Estado

Inicio

Fin

Duración

Registros procesados

Error generado

---

## Vista Pipeline

```text
Extracción

↓

Transformación

↓

Carga

↓

Validación
```

Cada etapa debe mostrar:

Verde = OK

Amarillo = En proceso

Rojo = Error

---

# 12. Calidad de Datos

## Objetivo

Controlar confiabilidad de la información.

### Indicadores

Completitud

Consistencia

Duplicados

Integridad

Validez

---

## Semáforo General

```text
98%

Nivel Excelente
```

---

# 13. Data Warehouse

## Objetivo

Visualizar estado estructural del DWH.

### Información

Tablas

Registros

Espacio utilizado

Última actualización

Crecimiento histórico

---

## Vista Modelo

FactProducción

├── DimCultivo

├── DimFecha

├── DimFundo

└── DimCampaña

---

# 14. Gestión de Catálogos

## Objetivo

Administrar datos maestros.

### Catálogos Iniciales

Fundos

Cultivos

Variedades

Campañas

Centros de Costo

Tipos de Producción

Unidades de Medida

---

## Operaciones

Crear

Editar

Desactivar

Consultar

---

# 15. Centro de Alertas

## Clasificación

Crítica

Advertencia

Información

---

## Funcionalidades

Filtrar

Marcar atendida

Historial

Asignación responsable

---

# 16. Bitácora

## Objetivo

Registrar trazabilidad total.

### Eventos

Inicio de sesión

Ejecución ETL

Cambios catálogo

Errores

Actualizaciones

---

## Vista Timeline

09:00

Carlos ejecutó ETL Producción

──────────────────

09:15

Actualización Catálogo Cultivos

──────────────────

09:20

Error ETL Meteorología

---

# 17. Requisitos No Funcionales

Frontend:

React

TypeScript

Tailwind CSS

Shadcn/UI

Recharts

TanStack Table

Lucide React

Backend:

FastAPI

Base de Datos:

SQL Server

API REST

JWT

Logs centralizados

---

# 18. Resultado Esperado

La plataforma debe convertirse en el punto único de monitoreo y gobierno de datos de la organización.

Un usuario debe poder conocer el estado de todo el ecosistema de datos en menos de 10 segundos sin acceder a código, scripts o consultas SQL.

