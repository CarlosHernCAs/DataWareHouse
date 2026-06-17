# Review UI/UX — `PAGINA UPDATE.md` (AgroData Control Center)

Aplicado con la skill **ui-ux-pro-max** (Quick Reference §1–§10) y comparado contra
el stack real del repo (Next.js 16 + Tailwind 4 + Radix/shadcn + Recharts + Plotly
+ TanStack Table). Esto NO es código todavía — es el filtro de calidad antes de
implementar.

---

## 1. Veredicto general

El plan es **sólido en intención** (DataOps / observabilidad estilo Azure
Portal + Grafana + Databricks) y **coherente con el stack ya instalado**.
La paleta y tipografía son apropiadas para un Control Center oscuro. Hay,
sin embargo, **omisiones críticas de accesibilidad, estados, y datos en
tiempo real** que conviene cerrar antes de codear.

Match con design-system: **DataOps Enterprise / Dense Dark Dashboard**.

---

## 2. Fortalezas del plan

- **Producto bien tipado**: observabilidad, no CRUD. Eso justifica densidad
  alta de información, sidebar persistente, semaforización y timeline.
- **Prioridad operativa explícita** (estado en <10s, 3 clics, alertas
  inmediatas). Encaja con el principio §1 *visual-hierarchy* y §9
  *nav-state-active*.
- **Paleta semántica correcta**: éxito / advertencia / crítico claramente
  separados. Cumple `color-semantic` (§6).
- **Inter + jerarquía 12-36px** es estándar de paneles enterprise; pareja
  natural con `weight-hierarchy` (400/500/600/700).
- **Stack ya alineado**: Recharts + Plotly + TanStack Table + Lucide ya
  están en `package.json` — no se necesita instalar nada nuevo.

---

## 3. Hallazgos críticos (resolver ANTES de implementar)

### 3.1 Contraste — riesgo de incumplir WCAG AA

Verificar pares (Quick Ref §1 `color-contrast`, §6 `color-accessible-pairs`):

| Par                         | Ratio aprox | Requisito | Acción                       |
| --------------------------- | ----------- | --------- | ---------------------------- |
| `#94A3B8` sobre `#0F172A`   | ~5.9:1      | AA OK     | Apto para body secundario    |
| `#94A3B8` sobre `#1E293B`   | ~4.5:1      | AA borderline | **No usar para texto <14px** |
| `#F59E0B` sobre `#1E293B`   | ~7:1        | OK        | OK                           |
| `#22C55E` sobre `#1E293B`   | ~5.4:1      | OK        | OK                           |
| `#2563EB` sobre `#0F172A`   | ~3.6:1      | **falla AA texto** | Subir a `#3B82F6` para texto/links |

> Decisión: texto azul nunca sobre `#0F172A`; usar `#3B82F6` o reservar
> `#2563EB` solo para superficies/CTAs con texto blanco encima.

### 3.2 Estados de UI ausentes

El plan describe **layouts**, pero no menciona estados de:

- **Empty state** (no hay ETL hoy, no hay alertas, catálogo vacío).
- **Loading** — un dashboard de observabilidad sin skeletons jamás se
  siente "pro" (Quick Ref §3 `progressive-loading`).
- **Error de red / backend caído** — irónico en un panel que monitorea
  salud de datos. Necesita `error-recovery` con reintento.
- **Stale data** — cuándo se actualizó por última vez cada widget.

Acción: agregar a cada bloque del Dashboard, Monitor ETL, DWH y Calidad
los 4 estados (empty / loading / error / stale).

### 3.3 Tiempo real / refresh

El plan no define la **estrategia de actualización**. En un Control
Center esto es la decisión arquitectónica #1.

Opciones:
- **Polling con TanStack Query** (`refetchInterval`) — simple, ya
  instalado, recomendado para MVP.
- **SSE / WebSocket** desde FastAPI — mejor UX, requiere infra extra.

Recomendación MVP: TanStack Query con intervals diferenciados
(Dashboard: 15s, Monitor ETL: 5s mientras un job está RUNNING, Alertas:
10s). Mostrar "Actualizado hace Xs" en cada card.

### 3.4 Header global usa emojis (🟢 🔴 🟡)

Viola `no-emoji-icons` (§4) y la convención explícita del repo:
> "Sin emojis en UI: usar Lucide React siempre" (README §Convenciones).

Reemplazar por `CheckCircle2`, `AlertTriangle`, `XCircle` de Lucide con
color semántico + `aria-label`.

### 3.5 Información ausente en Monitor ETL

El listado dice: Nombre, Estado, Inicio, Fin, Duración, Registros,
Error. Falta:
- **Usuario que lo disparó** (gobernabilidad, ya está en stack — JWT).
- **Tipo de trigger** (manual / scheduled / API).
- **Registros rechazados** vs procesados (clave en pipeline ACP con
  circuit breaker 5% — ver `CLAUDE.md` raíz del DWH).
- **Acciones**: reintentar, ver logs, abortar.

### 3.6 Sin definición de severidad/SLA para alertas

"Crítica / Advertencia / Información" es bueno, pero falta:
- **Tiempo de resolución esperado** por severidad.
- **Escalamiento** si nadie la atiende en X minutos.
- **Snooze / silenciar** (estándar en Grafana, PagerDuty).
- **Filtros persistentes** por responsable, sistema, severidad.

---

## 4. Hallazgos altos (mejorar la calidad percibida)

- **Densidad del Dashboard**: 6 bloques en una pantalla puede saturar.
  Aplicar `whitespace-balance` (§6) — agrupar en 3 filas:
  *(1) Salud General + Alertas activas* / *(2) Tendencia ETL + Calidad*
  / *(3) Estado DWH + Actividad reciente*.

- **KPI 36px en mobile**: si se accede desde tablet/móvil, 36px puede
  romper grilla. Definir escala fluida: `clamp(28px, 4vw, 36px)`.

- **Timeline de Bitácora**: añadir agrupado por día y filtro por tipo
  de evento; sin filtro es ruido. Usar `aria-live="polite"` si es
  streaming en vivo.

- **DWH "Vista Modelo" en ASCII**: en producción requiere un diagrama
  interactivo. Recomendado: **React Flow** (no listado en deps) o
  Plotly Sankey/Treemap (sí instalado). Ahorra dependencia: ir con
  Plotly inicialmente.

- **Catálogos**: el plan lista entidades, pero no menciona
  **versionado / audit trail / soft delete** que ya son requisitos en
  el resto del proyecto (esquema MDM en SQL Server). Alinear con el
  modelo existente.

- **Sidebar sin colapsar**: añadir colapso a sólo-iconos para usuarios
  power. Aumenta densidad útil. Respetar `navigation-consistency` (§9).

- **Falta search global** (`⌘K` / `Ctrl+K`). Es el estándar de Azure
  Portal, Databricks y Linear. Critical para "máximo 3 clics".

---

## 5. Hallazgos medios (pulido)

- **Tipografía**: definir también `font-mono` (JetBrains Mono o
  Geist Mono) para IDs de ETL, hashes, SQL preview y números tabulares
  (§6 `number-tabular`).
- **Charts**: especificar `legend-interactive` y `tooltip-on-interact`
  (§10) en cada gráfico de tendencia.
- **Tablas TanStack**: definir sort, paginación, column visibility,
  density toggle y export CSV desde el inicio — no como "fase 2".
- **Focus rings**: el plan no los menciona. En tema oscuro deben ser
  2–4px con color con buen contraste contra `#0F172A` (ej. `#60A5FA`).
- **Reduced motion**: cualquier animación de tendencia/transición debe
  desactivarse con `prefers-reduced-motion` (§7 `reduced-motion`).
- **Densidad táctil**: si bien es desktop-first, mantener tap targets
  ≥40×40px para tablets de operaciones en planta.

---

## 6. Tipografía: confirmar mejor pareja

`Inter` único está bien. Si se quiere distinción jerárquica:

- **H1/H2**: Inter 600/700, tracking -0.02em.
- **Body**: Inter 400, line-height 1.5.
- **Mono (datos)**: `JetBrains Mono` o `Geist Mono`, peso 500.

Esto cumple `font-pairing` + `weight-hierarchy` y mantiene una sola
familia variable (perf — `font-loading`).

---

## 7. Paleta — propuesta refinada (tokens semánticos)

```css
--bg-app:        #0B1220;  /* más profundo que #0F172A, mejor para AMOLED */
--bg-surface:    #111B2E;
--bg-surface-2:  #1B2740;  /* hover/active de cards */
--border-subtle: #1F2A44;
--border-strong: #334155;

--text-primary:  #F8FAFC;
--text-secondary:#CBD5E1;  /* sube de #94A3B8 para contraste AA fiable */
--text-muted:    #94A3B8;  /* solo en superficies #111B2E+ y >=14px */

--brand:         #3B82F6;  /* texto/link sobre fondo */
--brand-solid:   #2563EB;  /* superficies/CTAs */
--success:       #22C55E;
--warning:       #F59E0B;
--danger:        #EF4444;
--info:          #38BDF8;

--focus-ring:    #60A5FA;
```

Todos estos pares pasan AA contra `--bg-app` y `--bg-surface`.

---

## 8. Estructura de páginas — alineación con rutas existentes

El plan propone 8 secciones; el repo ya tiene rutas por rol (analista,
admin, ejecutivo) en `app/(analyst|admin|executive)`. Mapeo sugerido:

| Sección del plan       | Rol principal | Ruta sugerida                  | Reutiliza                     |
| ---------------------- | ------------- | ------------------------------ | ----------------------------- |
| Dashboard Ejecutivo    | Ejecutivo     | `app/(executive)/overview`     | `KpiCard`, `PlotlyChart`      |
| Monitor ETL            | Admin         | `app/(admin)/workflows`        | `DataTable`                   |
| Calidad de Datos       | Admin         | `app/(admin)/quality`          | charts + tabla                |
| Data Warehouse         | Analista      | `app/(analyst)/models` (nuevo `/dwh`) | tree + Plotly             |
| Catálogos              | Admin         | `app/(admin)/entities`         | `DataTable` (ya existe)       |
| Alertas                | Compartido    | `app/(admin)/alerts` (nueva)   | toasts + tabla                |
| Bitácora               | Admin         | `app/(admin)/audit`            | timeline custom               |
| Configuración          | Admin         | `app/(admin)/settings` (nueva) | forms RHF + Zod               |

> Implica crear sólo 3 rutas nuevas; el resto extiende lo que ya existe.

---

## 9. Checklist obligatorio pre-implementación

- [ ] Confirmar estrategia de refresh (polling vs SSE).
- [ ] Cambiar emojis del header por iconos Lucide.
- [ ] Adoptar tokens semánticos de §7 en `app/globals.css`.
- [ ] Definir los 4 estados (empty/loading/error/stale) por widget.
- [ ] Agregar `⌘K` global search (componente `CommandPalette`).
- [ ] Reservar espacio (`aspect-ratio`) en cards para evitar CLS.
- [ ] Verificar contraste con Stark/axe antes de mergear.
- [ ] Probar con `prefers-reduced-motion: reduce`.
- [ ] Probar en 375px (operadores con móvil/tablet).
- [ ] Definir export CSV de Monitor ETL y Catálogos desde MVP.

---

## 10. Priorización de implementación sugerida

1. **Tokens + Shell** (`RoleShell` ya existe — sólo retocar paleta).
2. **Dashboard Ejecutivo** (KPIs + estado general — alto valor visible).
3. **Monitor ETL** (es el "killer feature" del plan).
4. **Centro de Alertas** (depende de ETL).
5. **Calidad de Datos** + **Bitácora** (gobernabilidad).
6. **DWH explorer** + **Catálogos extendido**.
7. **Configuración** + `⌘K` global.

Cada paso ≤2 días con scaffolding existente.

---

_Generado con `ui-ux-pro-max`. Index codegraph activo (92 archivos, 631 nodos)
— para preguntas estructurales usar `codegraph_*`._
