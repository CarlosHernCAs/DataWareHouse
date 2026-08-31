# Compositor "ACP Hypr" — escritorio de datos para el administrador

Entorno de trabajo estilo **Hyprland** (compositor con *tiling* dinámico) para el lado
**administrador** del portal. Convierte las vistas operativas (Dashboard, Control ETL, DWH,
Calidad, Alertas, Catálogos, Configuración) en **ventanas en mosaico** dentro de
**workspaces** conmutables por teclado, con una **barra de estado (waybar)** viva, un
**lanzador** tipo rofi/wofi y un **panel de configuración** tipo `hyprland.conf`.

> Solo aplica al **administrador en escritorio**. Analista y ejecutivo, y cualquier viewport
> `< lg` (móvil/tablet), siguen usando el shell clásico (`RoleShell`) sin cambios.

---

## Para quién y cuándo se activa

`components/hypr/admin-shell-switcher.tsx` decide el shell en **cliente**:

| Condición | Shell |
|---|---|
| rol `admin` + preferencia `adminShell="hypr"` + viewport `≥ lg` | **Compositor Hypr** |
| móvil (`< lg`), rol analista, o preferencia `"clasico"` | `RoleShell` clásico |

- La preferencia `adminShell` (`"hypr"` \| `"clasico"`) vive en `localStorage`
  (`components/providers/preferencias-provider.tsx`). El admin arranca en Hypr por defecto.
- Salir al clásico: botón **"Vista clásica"** en la waybar (o acción del launcher).
- Volver a Hypr desde el clásico: botón flotante **"Modo Hypr"** (solo admin en escritorio),
  para que nadie quede atrapado.
- En SSR / primer render `useIsDesktop()` devuelve `false`, así que arranca en clásico y
  conmuta al compositor tras montar (sin hydration mismatch). El compositor nunca se
  renderiza en servidor.

---

## Arquitectura

```
app/(admin)/layout.tsx
  └─ AdminShellSwitcher            (elige shell; provee PreferenciasProvider)
       ├─ HyprShell                (compositor: estado, keymap global, overlays)
       │    ├─ Waybar              (workspaces + módulos vivos + sesión)
       │    ├─ HyprCanvas          (mosaico dockview; 1 instancia, N workspaces)
       │    │    └─ AppWindowPanel (monta la app admin lazy con Suspense+ErrorBoundary)
       │    ├─ Dock                (barra inferior: abrir apps como ventana)
       │    ├─ HyprLauncher        (cmdk: apps / workspaces / acciones WM)
       │    ├─ HyprKeymapHelp      (hoja de atajos, ?)
       │    └─ HyprSettings        (panel de configuración, Alt+,)
       └─ RoleShell                (fallback clásico)
```

Las "apps" son las *client-shells* de admin existentes, que ya se auto-alimentan por React
Query. Se registran en `lib/hypr/apps.ts` (lazy) y se montan como cuerpo de cada ventana.
`components/hypr/quality-window.tsx` es el único wrapper especial: reconstruye en cliente
los datos que Calidad recibía del server component (cuarentena + homologaciones +
reinyección) vía rutas BFF dedicadas.

---

## Workspaces y mosaico

- **5 workspaces** (`HYPR_WORKSPACES` en `lib/hypr/layout-store.ts`).
- Una sola instancia de dockview; al cambiar de workspace se **guarda** el layout actual y se
  **restaura** el del destino. Layouts serializados y persistidos en `localStorage`
  (`acp.hypr.layouts.v1`).
- El **workspace 1 arranca con Dashboard** abierto.
- Nuevas ventanas se abren en **mosaico dividido** (split a la derecha), no apiladas como
  pestañas — se siente como un tiling WM real.
- **Mover** una ventana a otro workspace (`Alt+Shift+N`) la reabre allí al entrar (modelo
  `pendingByWs`).
- La waybar marca qué workspaces están **ocupados** (punto) vs vacíos (atenuados).

## Waybar (`waybar.tsx`)

- Izquierda: **pills de workspace** (con nombre configurable e indicador de ocupación).
- Centro: botón de **lanzador** (`⌘K`).
- Derecha: **estado de conexión SSE** en vivo (`useSSEStatus`), **reloj**, **sesión**
  (usuario · rol), botón **`?`** (atajos), botón **engranaje** (configuración) y **"Vista clásica"**.

## Lanzador (`hypr-launcher.tsx`)

cmdk estilo rofi/wofi (`⌘K` o `Alt+D`). Abre apps **como ventanas** (no navega rutas), salta a
workspaces (por número o nombre), y expone acciones del WM: configuración, cerrar ventana,
vista clásica, cerrar sesión.

---

## Atajos de teclado

Leader = **Alt** (SUPER/Meta lo intercepta el SO). Fuente única: `lib/hypr/keymap.ts`
(la hoja de atajos `?` se genera de esa tabla). Los dígitos usan `e.code` (robusto con Shift).

| Atajo | Acción |
|---|---|
| `Ctrl/⌘ + K` | Abrir / cerrar el lanzador |
| `Alt + D` | Abrir el lanzador |
| `Alt + 1…5` | Ir al workspace |
| `Alt + Shift + 1…5` | Mover la ventana activa a un workspace |
| `Alt + F` | Pantalla completa (maximizar / restaurar) |
| `Alt + Shift + F` | Flotar / anclar la ventana activa |
| `Alt + Ctrl + ← / →` | Reducir / aumentar ancho |
| `Alt + Ctrl + ↑ / ↓` | Reducir / aumentar alto |
| `Alt + Q` | Cerrar la ventana activa |
| `Alt + ,` | Abrir / cerrar la configuración del compositor |
| `?` | Mostrar / ocultar la hoja de atajos |
| `Esc` | Cerrar lanzador / atajos / configuración |

El handler ignora teclas cuando el foco está en un campo editable (input/textarea/select/
contentEditable), salvo `⌘K`.

---

## Panel de configuración (`hypr-settings.tsx`, `Alt+,`)

Estilo `hyprland.conf`. Persistido en `localStorage` (`acp.hypr.config.v1`) vía
`lib/hypr/config-store.ts` (`useHyprConfig`). Se abre desde el engranaje de la waybar,
`Alt+,`, o el launcher.

- **Apariencia**: separación entre ventanas (gap del tema dockview, 0–20px), desenfoque
  (blur) on/off, animaciones on/off.
- **Workspaces**: nombre por workspace (aparece en la waybar y el launcher; vacío = número).
- **Restablecer** a valores por defecto.

Los valores se aplican en vivo: el gap va al tema de dockview; blur OFF pone `--blur-md: 0px`
y animaciones OFF pone las duraciones de motion a `0ms`, ambos **solo dentro del subárbol del
compositor** (no afectan al resto del portal, y no rompen el `prefers-reduced-motion` global).

---

## Mapa de archivos

**`components/hypr/`**
| Archivo | Rol |
|---|---|
| `admin-shell-switcher.tsx` | Elige Hypr vs clásico (cliente); re-entrada al compositor |
| `hypr-shell.tsx` | Compositor: estado, keymap global, CSS vars de config, overlays |
| `hypr-canvas.tsx` | Mosaico dockview; workspaces; acciones WM; ocupación |
| `app-window-panel.tsx` | Monta la app lazy de una ventana (Suspense + ErrorBoundary) |
| `waybar.tsx` | Barra de estado superior |
| `hypr-launcher.tsx` | Lanzador cmdk (apps / workspaces / acciones) |
| `hypr-keymap-help.tsx` | Hoja de atajos (`?`) |
| `hypr-settings.tsx` | Panel de configuración (`Alt+,`) |
| `quality-window.tsx` | Wrapper cliente de Calidad (datos vía BFF) |

**`lib/hypr/`**
| Archivo | Rol |
|---|---|
| `apps.ts` | Registro de apps admin lanzables como ventana (lazy) |
| `layout-store.ts` | Persistencia de layouts + workspace activo (localStorage) |
| `keymap.ts` | Catálogo declarativo de atajos (fuente única) |
| `config-store.ts` | Configuración del compositor (localStorage, `useHyprConfig`) |

**Rutas BFF (para la ventana de Calidad):**
`app/api/cc/quality/homologaciones/route.ts`, `app/api/cc/reinyeccion/candidatos/route.ts`.

**Estética:** tokens y `@keyframes` en `app/globals.css` (`--gap-tile*`, `--blur-*`,
`.hypr-blur`, `.hypr-window-focus`, `.hypr-anim-*`); accesores en `lib/design-tokens.ts`.

---

## Notas y límites conocidos

- Motor de tiling: **dockview** (`dockview-react@7.0.2`, tema `themeAbyss`). El "maximizar"
  redimensiona grupos (el activo ocupa todo, los demás a ancho 0); no aplica una clase CSS
  telltale.
- Respeta `prefers-reduced-motion` (además del toggle de animaciones).
- La configuración y los layouts son **por-navegador** (localStorage), no cross-device. Una
  fase futura podría migrarlos al blob backend por-usuario (patrón del workspace del analista).
- Las apps pesadas (Plotly, TanStack Table) se montan **lazy** y se desmontan al cerrar la
  ventana; no se mantienen las 7 apps montadas a la vez.
