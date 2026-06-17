# Context — Portal MDM / AgroData Control Center

> Snapshot para que cualquier agente (humano o IA) entienda **qué es**,
> **dónde vive** y **cómo se compone** este proyecto, sin leer todo el repo.

---

## 1. Qué es

**Portal MDM** (codename **AgroData Control Center**) es la interfaz web
única para el ecosistema de datos de ACP:

- Centro de operaciones de datos (no es CRUD ni ERP).
- Observabilidad, gobierno y administración de:
  - Procesos ETL (con bitácora, lanzador, detalle de corrida)
  - Calidad de Datos (cuarentena con resolver/rechazar)
  - Data Warehouse (medallion Bronce → Silver → Gold + explorador)
  - Catálogos / Datos Maestros (variedades, geografía, personal)
  - Alertas operativas (push real-time vía SSE, ack persistente)
  - Auditoría / Bitácora (filtros + paginación + detalle)
  - Configuración (perfil, preferencias, parámetros pipeline, reglas validación, usuarios)

Objetivo de negocio: estado completo del ecosistema **en <10 segundos**,
sin que el usuario tenga que tocar SQL Server o scripts.

Estado: **production-ready** en lo crítico (dashboard rápido, push real,
sesión robusta, alertas pulidas, lint+build verde).

---

## 2. Stack

| Capa            | Tecnología                                                 |
| --------------- | ---------------------------------------------------------- |
| Framework       | **Next.js 16** (App Router) + React 19                     |
| Lenguaje        | TypeScript 5                                               |
| Estilos         | **Tailwind CSS 4** + design tokens en CSS (`globals.css`)  |
| Componentes     | **Radix UI** (patrón shadcn/ui)                            |
| Tablas          | **TanStack Table v8**                                      |
| Charts          | **Recharts** (lazy-loaded) + **Plotly.js** (code-split)    |
| Forms           | React Hook Form + **Zod**                                  |
| Data / cache    | **TanStack Query v5** + **HydrationBoundary** (RSC prefetch) |
| Push real-time  | **Server-Sent Events** (Next.js Route Handler)             |
| Auth            | JWT httpOnly cookie + **jose**                             |
| Iconos          | **Lucide React** (jamás emojis)                            |
| Toasts          | **sonner** (envuelto en `useToast()`)                      |
| Command palette | **cmdk** + Radix Dialog                                    |
| Tests E2E       | Playwright                                                 |
| Backend         | **FastAPI** (separado, no en este repo)                    |
| Base de datos   | SQL Server (esquemas Bronce/Silver/Gold/MDM/Cuarentena)    |

---

## 3. Arquitectura de carpetas

```
portal-mdm/
├── app/
│   ├── (auth)/login/                 # Login (RHF + Zod) + banner sesión expirada
│   ├── (admin)/                      # Layout + rutas admin
│   │   ├── dashboard/                # Control Center principal (RSC + prefetch)
│   │   ├── etl-monitor/              # Listado + detalle de corrida + lanzar
│   │   ├── dwh/                      # Explorador del Data Warehouse
│   │   ├── quality/                  # Cuarentena: resolver/rechazar
│   │   ├── alerts/                   # Listado + ack/unack + secciones colapsables
│   │   ├── workflows/                # MDM workflows (homologación)
│   │   ├── catalogos/                # Variedades / Geografía / Personal
│   │   ├── bitacora/                 # Auditoría ETL paginada + drawer detalle
│   │   ├── configuracion/            # 5 cards: perfil, preferencias, parámetros, reglas, usuarios
│   │   └── layout.tsx                # RoleShell + SessionExpiredHandler + AlertStreamMount
│   ├── (analyst)/                    # Layout analista (/explore, /models, /reports)
│   ├── (executive)/                  # Layout ejecutivo (/overview, /etl-monitor, /alerts)
│   ├── api/
│   │   ├── auth/                     # login / logout / me (proxy a FastAPI)
│   │   └── cc/                       # Route handlers Control Center (validan con Zod)
│   │       ├── health/               # GET — devuelve fallos-recientes agregados
│   │       ├── alerts/
│   │       │   ├── route.ts          # GET (poll de fallback)
│   │       │   └── stream/route.ts   # SSE (push real, dedupe por fingerprint)
│   │       ├── etl/{runs,trend,active,facts}/
│   │       ├── quality/{[tabla]/[id]/{resolver,rechazar},list,route.ts}/
│   │       ├── dwh/{explorer,route.ts}/
│   │       ├── activity/             # Eventos recientes
│   │       ├── bitacora/{list,resumen}/
│   │       ├── catalogos/{variedades,variedades-dim/{[id]/{activar,desactivar}},geografia,personal}/
│   │       └── configuracion/{perfil/{clave},parametros/{[nombre]},reglas,usuarios/{[nombre]/{activar,desactivar}}}/
│   ├── error.tsx                     # Error boundary global
│   ├── not-found.tsx
│   ├── layout.tsx                    # Root: Providers (Query, Tooltip, Toast, Preferencias)
│   └── globals.css                   # Design tokens + Tailwind base + reduced-motion global
│
├── components/
│   ├── ui/                           # Button, Card, Badge, Input, Tabs, Skeleton, Tooltip…
│   ├── charts/                       # PlotlyChart (dynamic), recharts-theme
│   ├── control-center/               # Cards del dashboard + KPI + frame
│   │   ├── dashboard-cards.tsx       # 6 cards (lazy charts, iso-skeletons, empty states)
│   │   ├── dashboard-card-frame.tsx  # Frame común: border-l-4 tonal + hover ring
│   │   ├── hero-kpis.tsx             # 4 KPI tiles + sparkline lazy
│   │   ├── etl-trend-chart.tsx       # AreaChart aislado (lazy)
│   │   ├── quality-pie-chart.tsx     # PieChart aislado (lazy)
│   │   ├── kpi-sparkline.tsx         # Sparkline aislado (lazy)
│   │   └── severity-chip.tsx         # <SeverityChip>/<SeverityIcon> compartidos
│   ├── data-table/                   # DataTable genérico (TanStack)
│   ├── layout/                       # RoleShell, command-palette ⌘K, page-header
│   └── providers/                    # Query, Tooltip, Toast (sonner), Preferencias,
│                                     # AlertStreamMount, SessionExpiredHandler
├── hooks/
│   ├── use-control-center.ts         # Todos los hooks TanStack (cc/*) + detect 401
│   ├── use-alert-stream.tsx          # SSE EventSource + toast batch + severity routing
│   ├── use-toast.ts                  # Wrapper de sonner (variant: success/destructive/warning/default)
│   └── use-homologation.ts           # Workflows MDM legacy
├── lib/
│   ├── api/
│   │   ├── client.ts                 # apiFetch — server-side fetch al FastAPI
│   │   ├── server-fetch.ts           # fastapiFetchSafe — reenvía cookie httpOnly
│   │   └── session-events.ts         # Bus 'acp:session-expired' + UnauthorizedError
│   ├── auth/
│   │   ├── rbac.ts                   # Mapping rol → prefijos
│   │   ├── session.ts                # Verificación JWT criptográfica (jose)
│   │   ├── require-role.ts           # Guard de Server Components
│   │   └── cookie-config.ts          # COOKIE_NAME + options
│   ├── control-center/
│   │   ├── compute-alerts.ts         # Lógica única: combina ETL+cuarentena+acks → Alert[]
│   │   ├── dashboard-prefetch.ts     # prefetchDashboard(qc) en RSC
│   │   └── etl-status.ts             # Helpers de status ETL
│   ├── schemas/
│   │   ├── auth.ts                   # loginSchema + tipos
│   │   ├── control-center.ts         # Alert, EtlRun, SystemHealth, QualityKpis, DwhState…
│   │   └── homologation.ts
│   └── format.ts                     # Helpers fecha/número/porcentaje
├── e2e/                              # Playwright specs (dashboard + admin routes)
├── proxy.ts                          # Auth + RBAC gate optimista (ex-middleware Next 16)
└── public/
```

---

## 4. RBAC

Cuatro roles. Mapping centralizado en [lib/auth/rbac.ts](lib/auth/rbac.ts).

| Rol            | Prefijos permitidos                                                                            | Home          |
| -------------- | ---------------------------------------------------------------------------------------------- | ------------- |
| `viewer`       | Lectura del dashboard                                                                          | `/dashboard`  |
| `analyst`      | `/explore`, `/models`, `/reports`                                                              | `/explore`    |
| `analista_mdm` | + acciones de cuarentena, ack alertas, catálogos, parámetros pipeline                          | `/dashboard`  |
| `admin`        | TODO: `/dashboard`, `/etl-monitor`, `/dwh`, `/workflows`, `/quality`, `/alerts`, `/catalogos`, `/bitacora`, `/overview`, `/configuracion` | `/dashboard`  |
| `executive`    | `/overview`, `/etl-monitor`, `/alerts`                                                         | `/overview`   |

`proxy.ts` hace gating **optimista** (no verifica firma). La
verificación criptográfica vive en `lib/auth/session.ts` (Server
Components / route handlers). Nunca pongas lógica lenta o DB en
`proxy.ts`.

---

## 5. Integración con FastAPI

**Single source of truth**: el backend FastAPI ([backend/](../../../backend)).
Toda llamada del portal pasa por:

- **Server-side** (RSC, route handlers): `lib/api/server-fetch.ts`
  reenvía la cookie httpOnly y valida con Zod. Helper resiliente
  `fastapiFetchSafe<T>` retorna `null` en lugar de throw.
- **Cliente** (TanStack queries/mutations): `fetch` directo a
  `/api/cc/*` (route handlers locales que a su vez consumen el FastAPI).
  Los wrappers `fetchAndParse` / `fetchOk` en `hooks/use-control-center.ts`
  detectan 401 y disparan el evento `acp:session-expired`.

Contratos clave del backend ya estables:

```http
POST   /auth/login                           # form OAuth2 → JWT
GET    /auth/me                              # perfil del usuario
POST   /auth/cambiar-clave
GET    /auth/usuarios                        # admin
POST   /auth/usuarios                        # admin: crear
POST   /auth/usuarios/{n}/{activar|desactivar}

GET    /api/v1/etl/corridas                  # con filtros + limite
GET    /api/v1/etl/fallos-recientes?horas=24 # agregado liviano para /health
GET    /api/v1/auditoria/bitacora            # paginado + filtros
GET    /api/v1/auditoria/bitacora/resumen
GET    /api/v1/auditoria/bitacora/{id_log}

GET    /api/v1/cuarentena/resumen
GET    /api/v1/cuarentena/list
POST   /api/v1/cuarentena/{tabla}/{id}/{resolver|rechazar}

GET    /api/v1/alertas/acks                  # solo lee acks
POST   /api/v1/alertas/{id}/ack
DELETE /api/v1/alertas/{id}/ack

(catalogos, configuracion: paths análogos)
```

JWT payload esperado:

```json
{ "sub": "...", "role": "admin|analista_mdm|analyst|executive|viewer",
  "name": "...", "exp": ... }
```

Firma HS256/HS512 con `JWT_PUBLIC_SECRET`.

---

## 6. Variables de entorno

| Variable              | Default                 | Obligatoria en prod |
| --------------------- | ----------------------- | ------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Sí                  |
| `JWT_COOKIE_NAME`     | `mdm_session`           | No                  |
| `JWT_PUBLIC_SECRET`   | _(vacío)_               | **Sí**              |

---

## 7. Convenciones de UI (no negociables)

- **Cero emojis** en UI. Siempre Lucide React.
- **Touch targets ≥ 44px** (hit-area extendida si el icono es chico).
- **Focus rings visibles** (2px outline + offset) con token `--color-ring`.
- **Contraste WCAG AA** mínimo (4.5:1 texto normal). Todos los pares
  documentados en `globals.css`.
- **Server Components por defecto**; `"use client"` sólo donde haga falta
  (hooks, eventos, browser APIs).
- **Tokens semánticos** vía CSS variables (`var(--color-…)`), nunca hex
  en componentes.
- **Respetar `prefers-reduced-motion`** — la regla global en `globals.css`
  desactiva todas las animaciones. Componentes con motion de terceros
  (sonner, charts) lo gestionan explícitamente.
- **Tema base oscuro DataOps** estilo Azure Portal / Grafana / Databricks.

**Decisiones conscientes que rompen reglas globales** (documentadas
en [CLAUDE.md §4](CLAUDE.md)):

- **Side-stripe `border-l-4`** en cards y KPIs del Control Center.
  Banneado por `impeccable-design` (`skill-ban-side-stripe-borders`)
  pero lo mantenemos por contexto DataOps.
- **No stagger animation** en el dashboard (V7 descartado).
  Banneado por `impeccable-design` (`product-motion-no-page-load-sequence`).
  Los datos llegan hidratados; mostrarlos con secuencia decorativa empeora
  el percibido de velocidad.

---

## 8. Performance (medido)

Optimizaciones aplicadas en orden de impacto:

| Optimización                                                | Impacto                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------- |
| Dashboard como **Server Component + HydrationBoundary**     | Primer paint trae los datos hidratados (cero waterfall)       |
| **Polling lento + `placeholderData`**                       | ~14 req/min → ~6 req/min, sin flash de skeleton entre refetches |
| Endpoint `/api/v1/etl/fallos-recientes` **agregado**        | `/health` baja de 50 corridas a 3 campos por ciclo            |
| **SSE alertas (`/api/cc/alerts/stream`)**                   | Detección de alerta nueva: 30s → ~4s                          |
| `Cache-Control: stale-while-revalidate`                     | Browser sirve cache instantáneo + revalida en background      |
| **Recharts lazy via `next/dynamic`**                        | ~400KB chunk movido fuera del primer paint del dashboard      |
| `experimental.optimizePackageImports`                       | Tree-shake automático de `lucide-react`, `recharts`, `cmdk`, `@radix-ui/react-icons` |
| Plotly **code-split** (`plotly-wrapper.tsx`)                | 4.5 MB chunk sólo en `/models/[id]`, fuera del dashboard      |
| **Índices SQL** en `Auditoria.Log_Carga(Estado, FechaInicio)` | `/fallos-recientes` < 50ms en lugar de 600ms                 |

---

## 9. UX de sesión (logout 401)

Cualquier 401 en el cliente dispara una cadena coordinada
(`lib/api/session-events.ts` + `components/providers/session-expired-handler.tsx`):

1. Dedupe: solo se dispara una vez aunque N queries fallen a la vez.
2. `queryClient.cancelQueries()` + `.clear()` — detiene el storm.
3. SSE se cierra (`use-alert-stream.tsx` escucha el mismo evento).
4. POST `/api/auth/logout` (keepalive) limpia la cookie httpOnly.
5. Toast: "Sesión expirada — vuelve a iniciar sesión".
6. `router.replace("/login?reason=expired&next=<ruta>")`.
7. En login, banner amarillo con `Clock` icon + copy. Login OK llama
   `resetSessionExpired()` para rehabilitar el flag en la misma pestaña.

---

## 10. Push real-time (SSE)

Stream en `/api/cc/alerts/stream` (Next.js Route Handler, runtime nodejs):

- Poll interno cada **4 s** llamando a `computeAlerts()` (lógica
  compartida con el GET).
- Fingerprint determinístico del set; solo emite `event: update`
  cuando cambia.
- Heartbeat (`: heartbeat`) cada 15 s para no cerrarse por idle.
- `AbortSignal` para cleanup limpio cuando el cliente desconecta.
- Header `x-accel-buffering: no` para desactivar buffering en nginx.

Cliente (`hooks/use-alert-stream.tsx`):

- `EventSource` con backoff exponencial + jitter, cap 30 s.
- Aplica updates a `queryClient.setQueryData(["cc","alerts"], …)`.
- Toast push con **severity routing** (`critical→error`,
  `warning→warning`, `info→info`) y **batch** si llegan N>1 nuevas a la vez
  (un solo toast resumen con counts y action button "Ver").
- Cierra al recibir `acp:session-expired`.

El polling de `useActiveAlerts` quedó a 60 s como safety net si el
stream cae.

---

## 11. Plan de producto vigente

- **Plan vigente** del rediseño Control Center:
  [PAGINA UPDATE.md](PAGINA%20UPDATE.md).
- **Review crítico** con la skill `ui-ux-pro-max`:
  [REVIEW-PAGINA-UPDATE.md](REVIEW-PAGINA-UPDATE.md).
- **Audit con impeccable-design** sobre alerts + notifications, P0–P3
  aplicados (ver historial de commits).
- **Mejoras pendientes** acumuladas en [MEJORAS.md](MEJORAS.md).

---

## 12. Comandos clave

```bash
npm run dev          # Next.js dev (Turbopack)
npm run build        # build prod
npm run start        # serve prod
npm run lint         # ESLint
npm run test:e2e     # Playwright headless
npm run test:e2e:ui  # Playwright UI mode
```

---

## 13. CodeGraph

El proyecto tiene un índice **CodeGraph** activo en `.codegraph/`.
Es la fuente preferida para preguntas estructurales sobre el código.

Comandos MCP disponibles (prefijo `codegraph_`):

| Pregunta                              | Tool                  |
| ------------------------------------- | --------------------- |
| ¿Dónde está X?                        | `codegraph_search`    |
| ¿Cómo funciona / contexto de X?       | `codegraph_context`   |
| ¿Cómo llega X a Y? (trace)            | `codegraph_trace`     |
| ¿Quién llama a X?                     | `codegraph_callers`   |
| ¿Qué llama X?                         | `codegraph_callees`   |
| ¿Qué se rompe si cambio X?            | `codegraph_impact`    |
| Código fuente de X                    | `codegraph_node`      |
| Varios símbolos a la vez              | `codegraph_explore`   |
| Árbol de archivos                     | `codegraph_files`     |
| Salud del índice                      | `codegraph_status`    |

**Regla**: para cualquier pregunta estructural ("dónde está…", "qué
llama a…", "cómo se conecta…"), **usar codegraph antes de grep/read**.
Sólo cae a grep/read para texto literal (comentarios, mensajes de log)
o cuando ya estás dentro de un archivo concreto.

---

## 14. Skills instaladas (routing IA)

El entorno global tiene una navaja suiza de skills. La tabla completa
de routing vive en el [CLAUDE.md raíz](../../../../CLAUDE.md#skills-disponibles--routing-obligatorio).
Resumen para este proyecto:

| Para…                                       | Skill                                  |
| ------------------------------------------- | -------------------------------------- |
| Planear pantalla nueva                      | `anthropic-skills:ui-ux-pro-max`       |
| Pulir / auditar craft                       | `impeccable-design`                    |
| Brainstorm → plan → execute → verify        | Cadena `sp-*` de superpowers           |
| Debuggear bug                               | `sp-systematic-debugging`              |
| Decisión con tradeoff real                  | `claude-skills-llm-council`            |
| Tarea quirúrgica de un área                 | Sub-agent (`nextjs-developer`, `python-pro`, `code-reviewer`, …) |

Memoria entre sesiones: `claude-mem` (hooks automáticos, no se
invoca manualmente).

---

_Última actualización: 2026-06-03 — sesión "alto impacto" (SSE + sesión expirada + V5–V8 polish)._
