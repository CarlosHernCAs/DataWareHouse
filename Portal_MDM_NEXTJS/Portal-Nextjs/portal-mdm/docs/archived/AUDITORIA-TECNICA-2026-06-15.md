# Auditoría Técnica — Portal MDM (Next.js 16 / React 19)

> **Fecha:** 2026-06-15
> **Alcance:** `portal-mdm/` (frontend Next.js App Router + capa BFF de route handlers).
> **Método:** Descubrimiento completo del repositorio + lectura dirigida de la columna vertebral arquitectónica (auth/RBAC, capa API, providers, shell, hooks, flujo de proyecciones) + verificaciones objetivas (`tsc --noEmit`, mapeo de imports con ripgrep).
> **Backend FastAPI** (`backend/`) y **Streamlit legacy** (`acp_mdm_portal/`) quedan **fuera** de esta auditoría salvo por el contrato de endpoints que el portal consume.

---

## 1. Resumen Ejecutivo

El portal es un BFF (Backend-for-Frontend) sobre Next.js 16 con App Router, React 19 y TanStack Query v5. La **base es sólida**: `tsc --noEmit` pasa limpio en modo strict, el modelo RBAC tiene un diseño *fail-closed* bien razonado (`lib/auth/roles.ts`), la capa de fetch al FastAPI está bien encapsulada (timeouts, keep-alive, formateo de errores) y hay buenos patrones de performance (SSR prefetch con `HydrationBoundary`, polling adaptativo, code-splitting de charts pesados).

Sin embargo, la auditoría encontró un **clúster de regresiones de integración de alto impacto** que comparten una causa raíz común: **infraestructura "cliente" diseñada y construida, pero nunca montada en el árbol de componentes**. Tres mecanismos completos (manejo de sesión expirada, stream SSE de alertas, y la paleta de comandos) existen como código terminado pero **están desconectados**. A esto se suma un **gap en el `proxy.ts`** que rompería todo el portal del analista en runtime, enmascarado por stubs en los tests E2E.

**Veredicto:** arquitectura buena, **integración rota**. La mayoría de los problemas críticos se resuelven con cambios de 1–5 líneas (montar componentes / añadir un prefijo a una whitelist), pero su impacto funcional es severo. No hay deuda estructural profunda; hay deuda de *cableado*.

| Categoría | Crítico | Alto | Medio | Bajo |
|---|---|---|---|---|
| Bugs / Integración rota | 1 | 3 | 3 | 4 |
| Código muerto | — | 2 | 3 | 2 |
| RBAC / Seguridad | — | 1 | 2 | 2 |
| Performance | — | — | 2 | 3 |
| Redundancia | — | 1 | 2 | 1 |

---

## 2. Hallazgos Críticos

### 🔴 C-1 — `proxy.ts` bloquea TODO el portal del analista (`/api/analyst/*`)

**Severidad:** Crítica · **Riesgo de regresión:** Alto · **Esfuerzo de fix:** 1 línea

**Causa raíz.** El edge gate `proxy.ts` corre sobre todas las rutas excepto las excluidas por su `matcher`, que solo excluye `api/auth/`. Por lo tanto **corre sobre `/api/analyst/*`**. Para decidir si deja pasar, llama a `isRoleAllowed(role, pathname)` (`lib/auth/rbac.ts`), que solo aprueba:
- `SHARED_AUTHENTICATED_PREFIXES = ["/api/auth/logout", "/api/cc"]`, o
- los prefijos de página del rol (`/home`, `/quality`, …).

`/api/analyst/...` **no** está en la whitelist compartida ni empieza por ningún prefijo de página. Resultado del trace para un analista autenticado que pide `/api/analyst/home`:

```
isPublicPath("/api/analyst/home")          → false
token presente, parseRole → "analyst"      → ok
isRoleAllowed("analyst","/api/analyst/home") → false
  ↳ NextResponse.redirect("/home")   // 307 a HTML
```

El `fetch` del cliente sigue el 307 → recibe el HTML de `/home` (200) → `res.json()` lanza `SyntaxError` → el hook lo traga en su `.catch(() => {})`. **El workspace queda permanentemente vacío.** Afecta a los 4 endpoints del analista:

- `GET/PATCH /api/analyst/home` (workspace) — `hooks/use-analyst-home.ts`
- `POST /api/analyst/widget` (gráficos) — `hooks/use-analyst-widget.ts` + `use-analyst-home.ts`
- `GET /api/analyst/notifications` — `app/(analyst)/notifications/notifications-client.tsx`
- `GET /api/analyst/views` — modal de configuración de widgets

**Por qué pasó desapercibido.** Los tests E2E (`e2e/analyst-portal.spec.ts`) interceptan estas rutas con `page.route("**/api/analyst/...")` **antes** de que toquen el servidor real, así que el proxy nunca se ejecuta en CI. El síntoma "workspace analista siempre vacío" registrado en `PORTAL-AUDIT.md` (commit 8b07d57) se atribuyó a un endpoint backend faltante; el fix backend es necesario pero **insuficiente** mientras el proxy siga bloqueando la ruta.

**Reproducción.** Levantar Next + FastAPI, loguear como `analista_mdm`, abrir `/home` con la pestaña Network: la llamada a `/api/analyst/home` aparece como 307 → 200 (document) en lugar de 200 (json).

**Fix:**
```ts
// lib/auth/rbac.ts
export const SHARED_AUTHENTICATED_PREFIXES = [
  "/api/auth/logout",
  "/api/cc",
  "/api/analyst",   // ← añadir
];
```
Las rutas ya hacen su propio `requireApiRole("analyst")` internamente, así que la autorización fina no se pierde.

**Impacto del cambio:** archivos afectados: 1. Downstream: ninguno (solo amplía qué deja pasar el gate). **Tests requeridos:** un E2E que NO stubee `/api/analyst/*` y verifique status 200 + JSON, o un test de integración del propio `proxy`/`isRoleAllowed`.

> ⚠️ Recomiendo **confirmación en runtime** con backend arriba. El trace es determinista a nivel de código, pero merece verse en la pestaña Network antes de cerrar el ticket.

---

## 3. Reporte de Código Muerto

### 🟠 DC-1 — `SessionExpiredHandler` definido pero **nunca montado** (rompe el manejo de sesión expirada)

**Archivo:** `components/providers/session-expired-handler.tsx` · **Severidad:** Alta

`ripgrep` sobre todo el repo: el identificador `SessionExpiredHandler` **solo aparece en su propia definición**. No hay `import` en ningún layout, página ni `template.tsx` (no existen `template.tsx`). Su docstring afirma "Montado en cada layout protegido: (admin), (analyst), (executive)" — **falso en el código actual**.

**Consecuencia funcional.** La cadena de sesión expirada está rota de punta a punta:
- `hooks/use-control-center.ts` y otros llaman `dispatchSessionExpired()` ante un 401 y lanzan `UnauthorizedError`.
- El evento `acp:session-expired` se dispara… pero **no hay listener montado** que ejecute: cancelar queries → `queryClient.clear()` → `POST /api/auth/logout` → toast → `router.replace("/login")`.
- Efecto: cuando vence el JWT, el usuario ve queries en error sin redirección ni mensaje canónico. Queda "atascado" en una pantalla rota hasta recargar manualmente.

**Fix:** montar `<SessionExpiredHandler />` en `RoleShell` o en cada layout protegido.

### 🟠 DC-2 — `AlertStreamMount` / `use-alert-stream` nunca montado (SSE de alertas muerto)

**Archivos:** `components/providers/alert-stream-mount.tsx`, `hooks/use-alert-stream.tsx`, `app/api/cc/alerts/stream/route.ts` · **Severidad:** Alta

`AlertStreamMount` no se importa en ningún sitio. Por lo tanto `useAlertStream()` nunca corre y el **EventSource hacia `/api/cc/alerts/stream` jamás se abre**. Toda la infraestructura SSE (backoff exponencial con jitter, toasts agrupados por severidad, status `connecting/connected/reconnecting`, cierre al expirar sesión) es **inalcanzable**. El endpoint `/api/cc/alerts/stream` es un **endpoint huérfano** (sin consumidor).

El portal "funciona" porque `useActiveAlerts` hace polling cada 60 s como red de seguridad — pero la feature en tiempo real por la que se construyó toda esa maquinaria está apagada.

**Fix:** montar `<AlertStreamMount />` en el layout admin (es donde se diseñó para vivir, según su propio comentario).

### 🟠 DC-3 — Doble paleta de comandos, **ambas muertas** (~800 líneas + dependencia `cmdk`)

**Archivos:** `components/ui/command-palette.tsx` (`CommandPalette`, `CommandPaletteMount`) y `components/layout/command-palette.tsx` (`CommandPalette`, `CommandPaletteTrigger`) · **Severidad:** Alta (volumen) / funcional Media

Existen **dos implementaciones completas** de paleta de comandos. Ninguno de sus puntos de montaje (`CommandPaletteMount`, `CommandPaletteTrigger`) se importa fuera de su propio archivo. `RoleShell` no las renderiza. Son código muerto duplicado.

Implicaciones:
- La dependencia **`cmdk`** solo la consumen estos dos archivos muertos → **dependencia eliminable** del `package.json`.
- `components/layout/command-palette.tsx` es el **único consumidor vivo de `usePreferencias` fuera de `configuracion-client.tsx`**. Al estar muerto, la asimetría del `PreferenciasProvider` (ver R-2 / B-5) no provoca crash hoy, pero el código sugiere que en algún momento sí estuvo montado.

**Fix:** elegir UNA implementación, montarla (resuelve también la promesa de "command palette / quick-jump" que `lib/routes.ts` documenta pero nadie cumple), y **borrar la otra**. Si la feature no se quiere, borrar ambas + `cmdk`.

### 🟡 DC-4 — Mocks no usados

**Archivos:** `lib/mock/audit.ts`, `lib/mock/quality.ts`, `lib/mock/workflows.ts` · **Severidad:** Media

`ripgrep` confirma que solo `lib/mock/models.ts` se importa. Los otros tres mocks no tienen ningún consumidor → código muerto. (Ver también B-6: `lib/mock/models.ts` SÍ se usa pero sirviendo datos falsos a features "en producción").

### 🟡 DC-5 — Documentación obsoleta que referencia archivos inexistentes

- `PORTAL-AUDIT.md` referencia `components/layout/nav-sidebar.tsx` y el componente `NavSidebar` — **no existen**; la navegación vive embebida en `components/layout/role-shell.tsx`.
- `PORTAL-AUDIT.md` documenta un proxy genérico `/api/v1/**` en Next — **no existe** tal route handler; el proxying real es por `/api/cc/*` y `/api/analyst/*`.
- Docstrings de `session-expired-handler.tsx` y `alert-stream-mount.tsx` afirman estar montados cuando no lo están (ver DC-1/DC-2).

**Acción:** consolidar la documentación tras aplicar los fixes de integración.

### 🟢 DC-6 — Artefactos en working tree sin trackear

`git status` muestra `reports/`, `test-results/`, `playwright-report/`, `Context.md`, `PAGINA UPDATE.md`, `REVIEW-PAGINA-UPDATE.md`, `skills-lock.json`, `pnpm-lock.yaml` (coexistiendo con `package-lock.json`). **Dos lockfiles** (`pnpm-lock.yaml` + `package-lock.json`) es ambiguo para el gestor de paquetes — elegir uno. Añadir el resto a `.gitignore` o limpiar.

---

## 4. Reporte de Bugs

### 🟠 B-1 (= C-1) — Proxy bloquea `/api/analyst/*`. Ver Hallazgos Críticos.

### 🟠 B-2 (= DC-1) — Sesión expirada no se maneja (handler no montado).

### 🟠 B-3 (= DC-2) — SSE de alertas nunca conecta (mount faltante).

### 🟡 B-4 — `MatrixEditor`: inputs no controlados ignoran "Restaurar defaults" y la carga async

**Archivo:** `app/(analyst)/proyecciones/matrix-editor.tsx` · **Severidad:** Media

Los `<Input>` usan `defaultValue={(v*100).toFixed(0)}` (no controlados). Dos fallos de sincronización:
1. **`restaurar()`** hace `setMatriz(MATRIZ_DEFAULT)` pero los inputs ya montados conservan el texto tecleado — el usuario ve valores viejos aunque el estado interno (y lo que se envía) ya cambió. Desincronización UI/estado.
2. El `useEffect` que copia `guardada.data` a `matriz` (cuando llega del backend) tampoco se refleja en inputs ya renderizados.

**Reproducción:** abrir la matriz, editar W1 de "Fase 1", pulsar "Restaurar defaults" → el campo sigue mostrando el valor editado.

**Fix:** convertir a inputs controlados (`value` + `onChange`) con una `key` derivada, o forzar remount con `key={JSON.stringify(matriz)}` en el tbody al restaurar.

### 🟡 B-5 — `PreferenciasProvider` solo envuelve el grupo `(admin)`

**Archivos:** `app/(admin)/layout.tsx` vs `(analyst)/layout.tsx`, `(executive)/layout.tsx` · **Severidad:** Media (hoy latente)

Solo el layout admin monta `<PreferenciasProvider>`, y además lo monta envolviendo `children` **dentro** de `RoleShell`, no a `RoleShell` mismo. Consecuencias:
- Densidad/tema persistidos en `localStorage` **no se aplican al `<html>` para analyst/executive** (el `useEffect` que setea `data-density`/`data-theme` vive en el provider).
- Es una **bomba de tiempo**: si se monta cualquier command palette (DC-3) en `RoleShell`, su `usePreferencias()` lanzará `"usePreferencias debe usarse dentro de PreferenciasProvider"` y **tumbará el shell completo** para todos los roles, porque el provider no envuelve a `RoleShell`.

**Fix:** subir `PreferenciasProvider` a `RoleShell` (o a un layout raíz compartido) de modo que envuelva sidebar, header y children por igual, en los tres grupos.

### 🟡 B-6 — Features "en producción" sirviendo datos mock

**Archivos:** `app/(analyst)/models/page.tsx`, `app/(analyst)/models/[id]/page.tsx`, `app/api/cc/reports/[id]/route.ts`, `app/(executive)/overview/page.tsx` · **Severidad:** Media

- `/models` y `/models/[id]` renderizan `MODELS` desde `lib/mock/models.ts` (datos fabricados), no el backend.
- `/api/cc/reports/[id]` también responde con el mock `MODELS`.
- **`/overview` (portal ejecutivo) es 100% estático/hardcodeado**: "12 iniciativas activas", "9/14 áreas", "USD 1.2 M de ahorro" están escritos a mano en el JSX; `OverviewKpis`/`overview-charts` muy probablemente también. Un ejecutivo ve cifras inventadas presentadas como reales.

No es un bug de código, es **riesgo de negocio**: features que parecen terminadas pero no tienen datos reales. Deben marcarse explícitamente como "demo/WIP" en la UI hasta cablear el backend.

### 🟢 B-7 — Rate limiter de login con fuga de memoria lenta

**Archivo:** `app/api/auth/login/route.ts` · **Severidad:** Baja

`_loginAttempts: Map<ip, …>` nunca se purga: las entradas solo se sobrescriben cuando la misma IP vuelve tras expirar la ventana. Con muchas IPs distintas el Map crece sin cota. Es in-memory y single-process (declarado), así que el impacto real es bajo, pero conviene un barrido periódico o migrar a un store con TTL. Además la key viene de `x-forwarded-for` (spoofable) — aceptable para rate-limit best-effort, no para seguridad.

### 🟢 B-8 — `DetalleTable`: clave de fila/dedupe omite `fundo`

**Archivo:** `app/(analyst)/proyecciones/proyecciones-client.tsx` (`DetalleTable`) · **Severidad:** Baja

El `Map` agrupa por `modulo|turno|valvula|variedad` y la `key` de React es `${modulo}-${turno}-${valvula}-${variedad}`. Si dos fundos comparten esa combinación, las filas se **fusionan incorrectamente** y colisiona la key de React. Incluir `fundo` en ambas.

### 🟢 B-9 — `retry: 1` global reintenta incluso los 401

**Archivo:** `components/providers/query-provider.tsx` · **Severidad:** Baja

El default `retry: 1` hace que las queries reintenten una vez ante cualquier error, incluido el 401 de sesión expirada (doble request inútil antes de fallar). El `dispatchSessionExpired` está deduplicado, así que no hay storm de toasts, pero sí latencia y carga extra. Sugerencia: `retry: (count, err) => !isUnauthorizedError(err) && count < 1`.

### 🟢 B-10 — `data-theme` duplicado/contradictorio

`app/layout.tsx` fija `data-theme="dark"` en `<html>`; `PreferenciasProvider` luego escribe `data-theme="oscuro"` o lo borra. Convivencia de dos vocabularios (`dark` vs `oscuro`) y dos dueños del mismo atributo. Unificar nomenclatura y dueño.

---

## 5. Reporte de Redundancia

### 🟠 R-1 — Dos fuentes de verdad para RBAC que deben sincronizarse a mano

**Archivos:** `lib/routes.ts` vs `lib/auth/rbac.ts` · **Severidad:** Alta (riesgo de drift)

`lib/routes.ts` se autodescribe como "**fuente única** de las rutas" y su docstring afirma que "`lib/auth/rbac.ts` deriva `ROLE_ALLOWED_PREFIXES` desde acá". **Eso es falso:** `rbac.ts` mantiene su **propio array `ROUTE_ACL` hardcodeado** y no importa nada de `routes.ts`. Hay dos listas paralelas `ruta → roles` que deben mantenerse idénticas manualmente.

**Ya divergen en intención** (ver S-1): por ejemplo, los `roles` de `/alerts` y `/etl-monitor` en ambos archivos dicen `[admin, executive]`, pero el **grupo físico** `(admin)` donde viven contradice eso. Tres fuentes (routes.ts, rbac.ts, ubicación del archivo + layout) que no concuerdan.

**Fix de bajo riesgo:** derivar `ROUTE_ACL` desde `ROUTES` de `routes.ts` (un `Object.values(ROUTES).map(r => ({path, roles}))`), eliminando la lista duplicada. Cuidar el ciclo de imports (`routes.ts` importa iconos de lucide; `rbac.ts` debe quedar libre de React — extraer los `path/roles` a un módulo sin dependencias de UI).

### 🟡 R-2 — Dos librerías de charts (`recharts` + `plotly.js`)

`recharts` se usa en 6 sitios (dashboard, quality, overview, proyecciones, sparklines). `plotly.js-dist-min` + `react-plotly.js` solo alimentan: (a) `/models/[id]` (feature **mock**, B-6) y (b) los widgets del home analista (**bloqueados por C-1**). Es decir, **el único stack de charts que sirve datos reales hoy es recharts**; Plotly pesa ~1 MB (aunque va lazy) y sus dos consumidores están rotos o son demo. Decidir: o se rescatan esas features, o se elimina Plotly (`plotly.js-dist-min`, `react-plotly.js`, `@types/plotly.js`, `@types/react-plotly.js`).

### 🟡 R-3 — Lógica de fetch repetida en cada hook

Cada familia de hooks reimplementa su propio `fetchAndParse`/`fetchParse`/`fetchFigure` (en `use-control-center.ts`, `use-proyecciones.ts`, `use-analyst-home.ts`, `use-analyst-widget.ts`) con manejo de 401, parseo de error y `schema.parse` casi idénticos. Consolidar en un único `clientFetchJson(path, schema, init)` reduciría ~120 líneas duplicadas y unificaría el comportamiento de 401 (hoy `use-proyecciones` y `use-analyst-*` **no** disparan `dispatchSessionExpired`, así que un 401 ahí no activa el flujo de logout — relacionado con DC-1).

### 🟢 R-4 — `executive/layout.tsx` arma su `NAV` a mano

El layout ejecutivo hardcodea `const NAV = [{ href:"/overview", … }]` en vez de usar `buildNavGroups(role)` como admin y analyst. Inconsistencia menor; usar la derivación central.

---

## 6. Oportunidades de Performance

| ID | Hallazgo | Impacto | Detalle |
|---|---|---|---|
| P-1 | Plotly cargado para features rotas/mock | Medio | ~1 MB lazy. Si se elimina (R-2), se quita peso y 4 deps. |
| P-2 | `prefetchDashboard` hace 6 round-trips HTTP a su propio origin | Medio | El server llama `fetch(origin + /api/cc/*)`, re-entrando a routing+proxy+route handler que recién ahí llama a FastAPI. Reutiliza la lógica del handler (bien) pero duplica el camino. Alternativa: invocar las funciones de agregación (`computeAlerts`, `fastapiFetch`) directamente desde el prefetch. |
| P-3 | `useActiveCorridas` hace poll agresivo (5 s) ante error/primer fetch | Bajo | `if (!Array.isArray(data)) return 5_000` mantiene 5 s mientras el endpoint falle → martillea un backend caído. Backoff sería mejor. |
| P-4 | `opciones` en proyecciones recalcula 4 `Set` por render del dataset completo | Bajo | Está en `useMemo` (ok); si `combinaciones` es grande, considerar derivar en el server. |
| P-5 | Polling como única vía de alertas (SSE muerto, DC-2) | Bajo | Al reconectar el SSE (cuando se monte) bajará la carga de polling. |

**Positivos a conservar:** SSR prefetch con `HydrationBoundary` (dashboard), `keepPreviousData` para evitar flashes, dynamic import de charts pesados, pool undici keep-alive en `server-fetch.ts`, polling adaptativo en `useActiveCorridas`/`useCorridaDetail`.

---

## 7. Evaluación de Arquitectura

**Patrón general:** BFF limpio. El navegador nunca habla directo con FastAPI; pasa por route handlers `/api/cc/*` y `/api/analyst/*` que reenvían el JWT httpOnly (`server-fetch.ts`) y validan/derivan. Esto es correcto y seguro (el token nunca toca JS de cliente).

**Capas (de bien a mejorable):**
- **Auth/RBAC (muy buena):** diseño fail-closed explícito (`roles.ts`), separación edge (decode optimista) vs server (verificación con `jose`), guards de layout + página + API. La debilidad no es el diseño sino la **duplicación de la tabla de rutas** (R-1) y las **inconsistencias de grupo** (S-1).
- **Capa de datos (buena):** TanStack Query con keys consistentes, schemas Zod validando cada respuesta (`fetchAndParse` hace `schema.parse`), errores tipados (`ApiError`/`FastApiError`/`UnauthorizedError`).
- **Capa de presentación (correcta):** shell role-aware, primitivas UI shadcn-style, error boundaries por grupo (`error.tsx`).
- **Integración cliente (ROTA):** el punto débil real. Providers/handlers/streams construidos pero no montados (DC-1/2/3). Sugiere un refactor de `RoleShell` que dejó caer sus mounts.

**Separación de concerns:** buena en lib (`auth/`, `api/`, `schemas/`, `control-center/`). El acoplamiento problemático es **documental** (docstrings que mienten sobre el montaje) más que de código.

**Contratos front/back:** estables y validados con Zod, pero el **prefijo backend es heterogéneo** (`/api/v1/*`, `/auth/*`, `/health`) — no es un bug, pero conviene documentarlo como contrato explícito.

---

## 8. Mapa de Endpoints (BFF Next → FastAPI)

> Todos los `/api/cc/*` exigen `requireApiSession`/`requireApiRole`; el proxy los deja pasar vía `SHARED_AUTHENTICATED_PREFIXES`.

### Auth
| Ruta Next | Método | Destino FastAPI | Auth | Notas |
|---|---|---|---|---|
| `/api/auth/login` | POST | `POST /auth/login` (form-urlencoded) | Pública + rate-limit | Setea cookie httpOnly 8 h |
| `/api/auth/me` | GET | — (decodifica cookie local) | Sesión | |
| `/api/auth/logout` | POST | — (borra cookie) | — | |

### Analista — ⚠️ **TODAS bloqueadas por C-1 en runtime**
| Ruta Next | Método | Destino FastAPI |
|---|---|---|
| `/api/analyst/home` | GET/PATCH | `/api/v1/analista/home` |
| `/api/analyst/widget` | POST | `/api/v1/analista/widget` |
| `/api/analyst/notifications` | GET | `/api/v1/analista/notificaciones` |
| `/api/analyst/views` | GET | `/api/v1/analista/vistas` |

### Control Center (`/api/cc/*`)
| Grupo | Rutas Next | Destino(s) FastAPI |
|---|---|---|
| ETL | `etl/runs`, `etl/runs/[id]`, `etl/active`, `etl/trend`, `etl/facts` | `/api/v1/etl/corridas[...]`, `/corridas/activas`, `/facts` |
| Calidad | `quality`, `quality/list`, `quality/by-table`, `quality/trend`, `quality/[tabla]/[id]/{resolver,rechazar}` | `/api/v1/cuarentena[...]` |
| DWH | `dwh`, `dwh/facts`, `dwh/explorer` | `/api/v1/etl/facts` + `/api/v1/etl/corridas` (agregación con `Promise.allSettled`) |
| Alertas | `alerts` (GET), `alerts/[id]/ack` (POST/DELETE), `alerts/stream` (SSE) | `computeAlerts` → `/api/v1/etl/corridas` + `/cuarentena/resumen` + `/alertas/acks` |
| Bitácora | `bitacora/list`, `bitacora/[id]`, `bitacora/resumen` | `/api/v1/auditoria/bitacora[...]` |
| Catálogos | `catalogos/{variedades,variedades-dim[...],geografia,personal}` | `/api/v1/...` |
| Configuración | `configuracion/{usuarios[...],perfil,perfil/clave,parametros[...],reglas}` | `/auth/usuarios`, `/auth/me`, `/auth/cambiar-clave`, … |
| Proyecciones | `proyecciones/{fechas,combinaciones/[idTiempo],matriz,ejecutar}` | `/api/v1/proyecciones/*` |
| Salud | `health`, `activity` | `/health` + `/api/v1/etl/fallos-recientes` + `/cuarentena/resumen` |
| Reinyección | `reinyeccion` | `/api/v1/reinyeccion/ejecutar` |
| Reportes | `reports/[id]` | **MOCK** (`lib/mock/models`) |

### Endpoints anómalos
- **Huérfano:** `/api/cc/alerts/stream` — sin consumidor (DC-2).
- **Mock:** `/api/cc/reports/[id]` — datos fabricados (B-6).
- **Inalcanzables:** `/api/analyst/*` — vía proxy (C-1).

---

## 9. Análisis del Grafo de Dependencias

```
app/layout.tsx (root)
  └─ QueryProvider ─ TooltipProvider ─ ToastProvider
       └─ [grupos de ruta]
            (admin)/layout  → requireAnyRole([admin,analyst]) → RoleShell + PreferenciasProvider(children)
            (analyst)/layout→ requireAnyRole([analyst,admin]) → RoleShell  (sin PreferenciasProvider)  ← B-5
            (executive)/layout→ requireRole(executive)        → RoleShell  (NAV hardcodeado)            ← R-4

RoleShell  ──(NO monta)──> SessionExpiredHandler ❌  AlertStreamMount ❌  CommandPalette ❌   ← DC-1/2/3

Páginas → hooks → fetch(/api/cc|/api/analyst) → route handler → server-fetch → FastAPI
                                   │
                                   └─ Zod schemas (lib/schemas/*) validan cada respuesta

RBAC:  proxy.ts ─┐
       layouts  ─┼─> rbac.ts (ROUTE_ACL hardcodeado)   ⟂  routes.ts (ROUTES)   ← R-1 (deben sincronizarse a mano)
       pages    ─┘        + roles.ts (parseRole, fail-closed)
```

**Puntos únicos de falla (SPOF):**
- `lib/api/server-fetch.ts` — todo el tráfico al backend pasa por aquí (bien encapsulado; SPOF aceptable).
- `lib/auth/roles.ts::parseRole` — única resolución de rol; consumido por edge y server (deseable que sea SPOF).
- `RoleShell` — único shell de los 3 roles; al perder sus mounts arrastró 3 features (anti-SPOF: la integración debería estar en los layouts, no depender de un solo componente cliente).

**Dependencias frágiles:** `routes.ts ⟂ rbac.ts` (R-1); ubicación física de página ⟂ `roles` declarados (S-1).
**Ciclos:** ninguno detectado; `routes.ts` re-exporta `Bell` con un comentario sobre evitar ciclos con `role-shell` — señal de tensión de imports a vigilar.

---

## 10. Recomendaciones de Refactor (priorizadas por impacto/riesgo)

| # | Refactor | Problema | Riesgo | Beneficio | Side-effects |
|---|---|---|---|---|---|
| RF-1 | Añadir `/api/analyst` a `SHARED_AUTHENTICATED_PREFIXES` | C-1 | **Bajo** | Desbloquea portal analista | Ninguno (los handlers ya autorizan) |
| RF-2 | Montar `SessionExpiredHandler` + `AlertStreamMount` en `RoleShell` | DC-1/DC-2 | Bajo | Restaura sesión-expirada + SSE | `RoleShell` pasa a `"use client"` parcial (ya lo es) |
| RF-3 | Subir `PreferenciasProvider` a envolver `RoleShell` en los 3 grupos | B-5 | Bajo | Prefs consistentes + evita crash futuro de command palette | Revisar SSR de `useSyncExternalStore` (ya tiene `getServerSnapshot`) |
| RF-4 | Derivar `ROUTE_ACL` desde `ROUTES` (una sola fuente) | R-1 | Medio | Elimina drift RBAC | Cuidar separación UI/no-UI para no romper edge runtime |
| RF-5 | Elegir 1 command palette, montarla, borrar la otra + `cmdk` si no se usa | DC-3 | Bajo | −800 líneas / −1 dep | — |
| RF-6 | Unificar fetch de cliente en `clientFetchJson(path, schema)` | R-3 | Bajo | −120 líneas, 401 uniforme | Tocar 4 archivos de hooks |
| RF-7 | Inputs controlados en `MatrixEditor` | B-4 | Bajo | Corrige reset/carga | — |
| RF-8 | Decidir Plotly: rescatar features o eliminar stack | R-2/B-6 | Medio | −1 MB / −4 deps | Si se elimina, borrar `/models/[id]` charts y widgets analista |
| RF-9 | Marcar `/overview`, `/models`, `/reports` como demo o cablear backend | B-6 | Bajo | Evita mostrar datos falsos como reales | UX/contenido |

---

## 11. Análisis de Impacto de Cambios

| Cambio | Archivos | Módulos | APIs | DB | Impacto usuario | Riesgo |
|---|---|---|---|---|---|---|
| RF-1 (proxy whitelist) | `lib/auth/rbac.ts` | proxy + todos los hooks analista | habilita 4 endpoints | — | Analistas recuperan workspace/notifs/widgets | **Bajo** |
| RF-2 (montar handlers) | `role-shell.tsx` (+layouts) | sesión + alertas | activa `/alerts/stream` | — | Logout automático + alertas en vivo | Bajo |
| RF-3 (prefs provider) | 3 layouts / shell | preferencias | — | — | Tema/densidad para analyst/exec | Bajo |
| RF-4 (RBAC unificado) | `rbac.ts`, `routes.ts`, posible módulo nuevo | edge + server guards | — | — | Ninguno si se hace bien; **alto si se rompe** la derivación (afecta a TODA la autorización) | **Medio** |
| RF-8 (quitar Plotly) | `plotly-*`, `models/[id]`, `widget-grid` | charts | — | — | Pierde gráficos de features demo | Medio |

**Regla de oro:** RF-1/2/3/5/6/7 son fixes quirúrgicos aislados (hacer ya). RF-4 toca el corazón de la autorización — requiere tests de RBAC antes y después.

---

## 12. Evaluación de Deuda Técnica

**Naturaleza de la deuda:** no es estructural (el diseño es bueno), es **deuda de integración y de verdad documental**.

1. **Integración fantasma** (la peor): código terminado y testeado unitariamente pero nunca montado. Difícil de detectar porque "compila y los E2E pasan" — los E2E pasan porque *stubean* lo que ocultaría el problema. **Acción:** tests de integración que ejerciten el árbol real (sin `page.route` para las rutas que se quieren validar) + un check de "componentes exportados nunca importados" (p.ej. `ts-prune`/`knip`) en CI.
2. **Doble fuente de verdad RBAC** (R-1): toda autorización depende de mantener dos listas en sync a mano.
3. **Features mock presentadas como producción** (B-6): riesgo de negocio/credibilidad.
4. **Documentación que afirma estados falsos** (DC-5): `PORTAL-AUDIT.md` y docstrings desfasados erosionan la confianza en el resto de la doc.
5. **Higiene de tooling:** dos lockfiles, artefactos sin trackear, `as any` en `next.config.ts`.

**Herramientas sugeridas en CI:** `knip` o `ts-prune` (exports muertos), `depcheck` (deps no usadas como `cmdk`), y un smoke E2E "sin stubs" por rol.

---

## 13. Roadmap Priorizado

### Fase 1 — Fixes inmediatos (críticos / integración rota) · ~0.5–1 día
1. **RF-1**: añadir `/api/analyst` a `SHARED_AUTHENTICATED_PREFIXES` → desbloquea portal analista (C-1). *Verificar en runtime con Network.*
2. **RF-2**: montar `<SessionExpiredHandler />` y `<AlertStreamMount />` (DC-1/DC-2).
3. **RF-3**: subir `PreferenciasProvider` a envolver `RoleShell` en los 3 grupos (B-5).
4. Añadir un E2E **sin stubs** para `/home` analista que verifique JSON 200 (red de seguridad anti-regresión de C-1).

### Fase 2 — Refactor de bajo riesgo · ~1–2 días
5. **RF-5**: consolidar/eliminar command palettes + `cmdk` (DC-3).
6. **DC-4**: borrar `lib/mock/{audit,quality,workflows}.ts`.
7. **RF-7**: inputs controlados en `MatrixEditor` (B-4).
8. **RF-6**: unificar `clientFetchJson` + propagar `dispatchSessionExpired` a hooks de proyecciones/analista (B-9, R-3).
9. Higiene: un solo lockfile, `.gitignore` de artefactos, actualizar `PORTAL-AUDIT.md` (DC-5).

### Fase 3 — Mejoras arquitectónicas · ~2–4 días
10. **RF-4**: derivar `ROUTE_ACL` desde `ROUTES` (R-1), con tests de RBAC.
11. Resolver inconsistencias de grupo de `/alerts` y `/etl-monitor` vs sus `roles` declarados (S-1, ver §14).
12. **B-6**: cablear o marcar como demo `/overview`, `/models`, `/reports`.
13. Integrar `knip`/`depcheck` + smoke E2E por rol en CI.

### Fase 4 — Performance / escalabilidad · ~1–2 días
14. **RF-8**: decisión Plotly (P-1/R-2).
15. **P-2**: prefetch del dashboard llamando agregadores directamente.
16. **P-3/B-7**: backoff en polling ante error; purga del rate limiter (o store con TTL).

---

## 14. Apéndice — Inconsistencias RBAC (S-1) y cobertura de la auditoría

### S-1 · Gaps RBAC confirmados
| Ruta | `routes.ts`/`rbac.ts` dicen | Grupo físico + layout | Acceso real | Problema |
|---|---|---|---|---|
| `/alerts` | `[admin, executive]` | `(admin)` → `requireAnyRole([admin,analyst])`, sin guard de página | admin + **analyst** | Analyst ve algo declarado admin/exec; **executive NO puede** (layout lo bloquea) |
| `/etl-monitor` | `[admin, executive]` | `(admin)` idem, sin guard | admin + **analyst** | Igual que arriba |
| `/overview` | `[admin, executive]` | `(executive)` → `requireRole(executive)` estricto | solo executive | **admin NO puede** pese a estar declarado |

Causa: la ubicación de la página (grupo de ruta) gobierna el layout, que **no coincide** con los `roles` declarados. Solución limpia: mover `/alerts` y `/etl-monitor` a un grupo cuyo layout permita `[admin, executive]`, y cambiar el layout ejecutivo a `requireAnyRole([executive, admin])`.

### Cobertura y límites de esta auditoría (sin asumir)
**Leído en profundidad:** toda la capa auth/RBAC, capa API/BFF (`lib/api/*` + las ~50 route handlers mapeadas), providers, `RoleShell`, layouts de los 3 grupos, hooks principales (control-center, analista, alert-stream, proyecciones), flujo completo de proyecciones, prefetch del dashboard, `compute-alerts`, y los E2E del analista.

**No leído línea por línea (verificación pendiente):** el suite de ~25 componentes del **DWH Explorer** (`components/control-center/dwh-*`), los clientes de `catalogos`, `configuracion`, `bitacora`, `quality` y `entities`, y el detalle interno de los ~40 route handlers `/api/cc/*` no centrales. No detecté señales de problemas ahí, pero **no afirmo que estén libres de bugs**.

**Contexto que falta para cerrar conclusiones:**
- **Runtime con FastAPI arriba** para confirmar C-1 en la pestaña Network (el trace es determinista, pero conviene la confirmación empírica).
- **Contrato real del backend** (OpenAPI de FastAPI) para validar 1-a-1 los shapes que asumen los schemas Zod, sobre todo `/api/v1/analista/*` y `/api/v1/proyecciones/*`.
- **Bundle analyzer** (`next build` + analyze) para cuantificar P-1 (peso real de Plotly en cada chunk).
- Confirmar si `/overview`, `/models`, `/reports` son demos intencionales o features a medio cablear (decisión de producto, no de código).
