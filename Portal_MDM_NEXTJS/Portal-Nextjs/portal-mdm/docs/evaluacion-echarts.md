# Evaluación — migración del stack de gráficos a Apache ECharts

Fecha: 2026-08-31 · Estado: **evaluación (sin migrar código)**

## Resumen y recomendación

Hoy el portal usa **dos** librerías de gráficos: **Recharts** (5 usos, todo cliente) y
**Plotly** (2 usos, uno de ellos generado por el backend Python). Migrar a **Apache ECharts**
es **viable y recomendable a medio plazo** porque consolida a una sola librería y reduce
bundle (Plotly pesa ~4.5MB por chunk). Pero el esfuerzo se parte en dos niveles muy
distintos, y solo el primero es autocontenido en el frontend.

**Recomendación:** hacer un **POC** (1 gráfico representativo) para validar wrapper, tema
oscuro/claro con los tokens del portal, interacción y bundle real; luego **Tier 1**
(frontend). **Tier 2** (motor de gráficos del backend) se decide después, según resultados,
porque toca Python y el contrato de widgets del analista.

---

## 1. Inventario actual

### Recharts — 5 usos, 100% construidos en cliente
| Archivo | Gráfico |
|---|---|
| `components/control-center/etl-trend-chart.tsx` | Tendencia ETL (líneas/área) |
| `components/control-center/kpi-sparkline.tsx` | Sparkline de KPI |
| `components/control-center/quality-pie-chart.tsx` | Distribución de calidad (pie) |
| `app/(executive)/overview/overview-charts.tsx` | Overview ejecutivo (área) |
| `app/(admin)/quality/quality-charts.tsx` | Gráficos de calidad (varios) |
| `components/charts/recharts-theme.ts` | Tema/paleta compartida (tokens del portal) |

### Plotly — 2 usos
| Archivo | Origen de la figura |
|---|---|
| `app/(analyst)/proyecciones/proyecciones-client.tsx` | **Cliente** (vía `components/charts/plotly-wrapper.tsx`) |
| `components/analyst/plotly-widget.tsx` | **Backend** — `backend/servicios/servicio_analista_charts.py` |

`components/charts/plotly-wrapper.tsx` carga `plotly.js-dist-min` de forma dinámica y aplica
theming; su propio comentario documenta que Plotly pesa **~4.5MB por chunk**.

`servicio_analista_charts.py` es un **motor genérico de widgets**: recibe un `ConfigWidget`
(tipo de gráfico + ejes + agrupación) y produce una figura Plotly (`{data, layout}` JSON) vía
`plotly.express`/`graph_objects`. Cubre **8 tipos**: línea, barra, área, scatter, pie, KPI
(indicator), tabla y forecast. Es el corazón del **constructor de widgets del analista**.

Dependencias: `plotly.js-dist-min@^3.5.0`, `react-plotly.js@^2.6.0`, `recharts@^3.8.1`.

> Fuera de alcance: `acp_mdm_portal/paginas/proyecciones.py` (portal Streamlit legado, también
> usa plotly) — no forma parte del portal Next.js.

---

## 2. Por qué migrar

- **Consolidación**: hoy conviven dos librerías con dos temas; ECharts unificaría todo en una
  API y un tema.
- **Bundle**: Plotly es, con diferencia, la dependencia de gráficos más pesada del portal.
- **Capacidades**: ECharts cubre con holgura todos los tipos en uso (incl. gauge para KPIs,
  tablas se resuelven mejor con HTML nativo) y tiene buen rendimiento con canvas/SVG.

## 3. Viabilidad de ECharts

- **Wrapper React**: `echarts-for-react` (estándar) o un binding propio delgado con
  `echarts/core` + `useRef`/`useEffect` (evita una dependencia extra y da control del
  ciclo de vida/resize). Recomendado el binding propio, alineado con el patrón `dynamic`
  ya usado en `plotly-wrapper.tsx` (carga client-only, `ssr:false`).
- **Tree-shaking**: importar desde `echarts/core` + registrar solo los charts/components
  necesarios (`LineChart`, `BarChart`, `PieChart`, `GaugeChart`, `GridComponent`,
  `TooltipComponent`, `LegendComponent`, `CanvasRenderer`). Esto es lo que hace la diferencia
  de peso frente a Plotly (monolítico).
- **Tema con tokens**: registrar un tema ECharts (`echarts.registerTheme`) construido desde
  las CSS vars del portal (`--color-primary/success/warning/info/destructive`, `--color-text*`,
  `--color-border`), replicando lo que hoy hace `recharts-theme.ts` / el theming de
  `plotly-wrapper.tsx`. Soporta claro/oscuro leyendo los tokens en runtime.
- **Paridad de tipos**: line ✓, bar ✓, area (line + areaStyle) ✓, scatter ✓, pie ✓,
  KPI → `gauge`/`GaugeChart` o texto+número ✓, tabla → HTML nativo (mejor que Plotly Table) ✓,
  forecast → line con series de intervalo ✓.

## 4. Comparación de bundle (verificar con el analizador antes de decidir)

| Stack | Peso aprox. |
|---|---|
| Plotly (`plotly.js-dist-min`) | ~4.5 MB por chunk (según comentario en `plotly-wrapper.tsx`) |
| Recharts | moderado (depende de D3 interno) |
| **ECharts tree-shaken** (core + ~5 charts + ~4 components) | objetivo **~300–500 KB** min |

> Las cifras de ECharts son estimaciones de referencia; deben confirmarse con el bundle
> analyzer del proyecto tras el POC. El punto clave es que Plotly (monolítico) es el mayor
> ofensor y ECharts tree-shaken debería recortarlo de forma sustancial.

## 5. Alcance por fases

### Tier 1 — Frontend (autocontenido, sin backend)
Migrar los gráficos construidos en cliente:
- Los 5 de Recharts (`etl-trend-chart`, `kpi-sparkline`, `quality-pie-chart`,
  `overview-charts`, `quality-charts`).
- El Plotly cliente de `proyecciones-client.tsx`.
- Crear `components/charts/echarts-wrapper.tsx` (binding client-only con tema por tokens) y un
  `echarts-theme.ts`. Migrar chart por chart. Al terminar, **eliminar `recharts`** y el uso
  cliente de Plotly.
- Riesgo: bajo. Cada gráfico es independiente y verificable en aislamiento.

### Tier 2 — Backend (motor de widgets del analista)
- Reescribir `backend/servicios/servicio_analista_charts.py` para emitir **`option` de ECharts**
  (JSON) en vez de figuras Plotly, cubriendo los 8 tipos.
- Migrar `components/analyst/plotly-widget.tsx` → `echarts-widget.tsx` que consuma esa `option`.
- Ajustar el contrato/serialización entre backend y frontend (hoy `{data, layout}` Plotly).
- Al terminar, **eliminar `plotly.js-dist-min` y `react-plotly.js`** por completo.
- Riesgo: medio-alto. Toca Python, el contrato del widget builder y su UX de configuración.

## 6. Esfuerzo y riesgos

| Ítem | Tier 1 | Tier 2 |
|---|---|---|
| Superficie | 6 archivos frontend + wrapper/tema | 1 servicio Python + 1 componente + contrato |
| Riesgo | Bajo | Medio-alto |
| Dependencias eliminadas | `recharts` | `plotly.js-dist-min`, `react-plotly.js` |
| Bloqueadores | Ninguno | Requiere paridad exacta de los 8 tipos + tests del backend |

Riesgos transversales: paridad visual (tooltips, leyendas, ejes de tiempo), accesibilidad
(ECharts es canvas por defecto — considerar `SVGRenderer` para DOM inspeccionable), y el
theming claro/oscuro en vivo.

## 7. Recomendación final

1. **POC** (0.5–1 día): migrar `etl-trend-chart.tsx` a ECharts con `echarts-wrapper` + tema por
   tokens; medir bundle real y validar claro/oscuro + tooltips.
2. Si el POC convence, **Tier 1** completo y quitar Recharts.
3. Evaluar **Tier 2** como proyecto aparte (coordinando backend), y solo entonces eliminar
   Plotly.

Así se obtiene valor y validación temprana con riesgo bajo, dejando la parte cara (backend)
para una decisión informada.
