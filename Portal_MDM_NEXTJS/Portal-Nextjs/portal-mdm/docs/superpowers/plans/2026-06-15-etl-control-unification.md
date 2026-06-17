# ETL Control Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidar Monitor ETL, Auditoría ETL y Bitácora en la ruta `/etl-control` con 3 tabs (`En vivo` / `Historial` / `Bitácora`), extrayendo utilidades compartidas (`formatDuration`, `EmptyState`, `ErrorPanel`) y eliminando código muerto.

**Architecture:** Se crea `app/(admin)/etl-control/` con un `EtlControlClient` que posee el estado del tab activo en la URL (`?tab=live|history|bitacora`). Cada tab es un componente separado en `tabs/`. Las rutas legacy `/etl-monitor`, `/audit` y `/bitacora` se eliminan; las sub-rutas de lanzar y detalle (`/etl-monitor/lanzar`, `/etl-monitor/[id]`) se preservan con `hideFromNav: true` en `ROUTES`. La `Auditoría` (EtlLog server-side) se fusiona con el `Historial` usando `useEtlRuns`, que es más rico (tiene `corridaId`, retry links).

**Tech Stack:** Next.js 14 App Router, shadcn/ui Tabs, TanStack React Table, @tanstack/react-query, lucide-react, Tailwind CSS, `useUrlState` hook

---

## File Map

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| MODIFY | `lib/format.ts` | Añadir `formatDuration(sec)` |
| CREATE | `components/ui/empty-state.tsx` | Estado vacío genérico |
| CREATE | `components/ui/error-panel.tsx` | Panel de error genérico con retry |
| CREATE | `app/(admin)/etl-control/tabs/live-tab.tsx` | Tab "En vivo" (port de LiveTab) |
| CREATE | `app/(admin)/etl-control/tabs/history-tab.tsx` | Tab "Historial de Corridas" (unifica Monitor + Auditoría) |
| CREATE | `app/(admin)/etl-control/tabs/bitacora-tab.tsx` | Tab "Bitácora" (port de BitacoraClient sin PageHeader) |
| CREATE | `app/(admin)/etl-control/etl-control-client.tsx` | Contenedor de tabs con URL sync |
| CREATE | `app/(admin)/etl-control/page.tsx` | Server component con metadata y PageHeader |
| MODIFY | `lib/routes.ts` | Añadir `etlControl`, ocultar `etlMonitor`, eliminar `bitacora` y `audit` |
| DELETE | `app/(admin)/etl-monitor/page.tsx` | Obsoleto — reemplazado por etl-control |
| DELETE | `app/(admin)/etl-monitor/etl-monitor-client.tsx` | Idem |
| DELETE | `app/(admin)/etl-monitor/loading.tsx` | Idem |
| DELETE | `app/(admin)/audit/page.tsx` | Obsoleto — fusionado en history-tab |
| DELETE | `app/(admin)/audit/etl-audit-client.tsx` | Idem |
| DELETE | `app/(admin)/bitacora/page.tsx` | Obsoleto — reemplazado por bitacora-tab |
| DELETE | `app/(admin)/bitacora/bitacora-client.tsx` | Idem |

**Preservar intactos** (siguen funcionando como sub-rutas de etlMonitor con RBAC):
- `app/(admin)/etl-monitor/lanzar/` — formulario de lanzamiento
- `app/(admin)/etl-monitor/[id]/` — detalle de corrida

---

## Task 1: Add `formatDuration` to `lib/format.ts`

**Files:**
- Modify: `lib/format.ts`

- [ ] **Step 1: Add the function**

Append at the end of `lib/format.ts`:

```typescript
export function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m ${s.toString().padStart(2, "0")}s`;
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add lib/format.ts
git commit -m "feat(format): add formatDuration utility"
```

---

## Task 2: Create `components/ui/empty-state.tsx`

**Files:**
- Create: `components/ui/empty-state.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/ui/empty-state.tsx
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-6 py-12 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
        {description && (
          <p className="max-w-md text-xs text-[var(--color-text-muted)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/empty-state.tsx
git commit -m "feat(ui): add generic EmptyState component"
```

---

## Task 3: Create `components/ui/error-panel.tsx`

**Files:**
- Create: `components/ui/error-panel.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/ui/error-panel.tsx
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorPanelProps {
  message: string;
  onRetry: () => void;
}

export function ErrorPanel({ message, onRetry }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-md border border-[color-mix(in_oklab,var(--color-destructive)_40%,transparent)] bg-[var(--color-surface-2)] p-4 text-sm"
    >
      <div className="flex items-center gap-2 text-[var(--color-destructive)]">
        <AlertTriangle aria-hidden className="h-4 w-4" />
        <span className="font-medium">No se pudo cargar</span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw aria-hidden className="h-3.5 w-3.5" />
        Reintentar
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/error-panel.tsx
git commit -m "feat(ui): add generic ErrorPanel component"
```

---

## Task 4: Create `app/(admin)/etl-control/tabs/live-tab.tsx`

**Files:**
- Create: `app/(admin)/etl-control/tabs/live-tab.tsx`

Port de `LiveTab()` y `EmptyLive()` desde `etl-monitor-client.tsx`, usando los nuevos componentes genéricos.

- [ ] **Step 1: Create the file**

```tsx
// app/(admin)/etl-control/tabs/live-tab.tsx
"use client";

import Link from "next/link";
import { Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorPanel } from "@/components/ui/error-panel";
import { ActiveRunCard } from "@/components/control-center/active-run-card";
import { useActiveCorridas } from "@/hooks/use-control-center";
import { isUnauthorizedError } from "@/lib/api/session-events";
import { cn } from "@/lib/utils";

export function LiveTab() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useActiveCorridas();

  return (
    <section aria-label="Corridas ETL en curso" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span
            aria-hidden
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              isFetching
                ? "bg-[var(--color-primary)] animate-pulse"
                : "bg-[var(--color-success)]",
            )}
          />
          <span>
            {isFetching ? "Sincronizando…" : "Actualizando cada 5 segundos"}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          aria-label="Refrescar corridas activas"
        >
          <RefreshCw
            aria-hidden
            className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
          />
          Refrescar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        isUnauthorizedError(error) ? null : (
          <ErrorPanel
            message={
              error instanceof Error
                ? error.message
                : "No se pudo cargar el estado en vivo."
            }
            onRetry={() => refetch()}
          />
        )
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Sin corridas en curso"
          description="Cuando un fact se esté ejecutando aparecerá aquí con su pipeline en tiempo real y heartbeat del runner."
          action={
            <Button asChild variant="primary" size="sm" className="mt-2">
              <Link href="/etl-monitor/lanzar">Lanzar una corrida</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {data.map((c) => (
            <ActiveRunCard key={c.id} corrida={c} />
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/etl-control/tabs/live-tab.tsx"
git commit -m "feat(etl-control): live-tab using generic EmptyState and ErrorPanel"
```

---

## Task 5: Create `app/(admin)/etl-control/tabs/history-tab.tsx`

**Files:**
- Create: `app/(admin)/etl-control/tabs/history-tab.tsx`

Fusión del `HistoryTab` de etl-monitor con la vista de Auditoría. Usa `useEtlRuns` (más rico que EtlLog: tiene corridaId, retry links) y `formatDuration` de lib/format.

- [ ] **Step 1: Create the file**

```tsx
// app/(admin)/etl-control/tabs/history-tab.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorPanel } from "@/components/ui/error-panel";
import { DataTable } from "@/components/data-table/data-table";
import { EtlStatusBadge } from "@/components/control-center/etl-status-badge";
import { useEtlRuns } from "@/hooks/use-control-center";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/format";
import { isUnauthorizedError } from "@/lib/api/session-events";
import { cn } from "@/lib/utils";
import type { EtlRun } from "@/lib/schemas/control-center";
import type { ColumnDef } from "@tanstack/react-table";

const LIMIT_OPTIONS = [25, 50, 100] as const;
type LimitOption = (typeof LIMIT_OPTIONS)[number];

export function HistoryTab() {
  const [{ limit: rawLimit }, setUrlState] = useUrlState({ limit: 50 });
  const limit: LimitOption = (LIMIT_OPTIONS as readonly number[]).includes(rawLimit)
    ? (rawLimit as LimitOption)
    : 50;

  const { data, isLoading, isError, error, refetch, isFetching } =
    useEtlRuns(limit);

  const columns = useMemo<ColumnDef<EtlRun, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Proceso",
        cell: ({ row }) => (
          <span className="font-medium text-[var(--color-text)]">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "table",
        header: "Tabla destino",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--color-text-secondary)]">
            {row.original.table ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <EtlStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "startedAt",
        header: "Inicio",
        cell: ({ row }) =>
          row.original.startedAt ? (
            <span className="tabular-nums text-xs">
              {formatDateTime(row.original.startedAt)}
            </span>
          ) : (
            <span className="text-[var(--color-text-muted)]">—</span>
          ),
      },
      {
        accessorKey: "durationSec",
        header: "Duración",
        cell: ({ row }) => (
          <span className="tabular-nums text-xs text-[var(--color-text-secondary)]">
            {formatDuration(row.original.durationSec)}
          </span>
        ),
      },
      {
        accessorKey: "rowsProcessed",
        header: "Filas OK",
        cell: ({ row }) => (
          <span className="tabular-nums text-xs">
            {row.original.rowsProcessed != null
              ? formatNumber(row.original.rowsProcessed)
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "rowsRejected",
        header: "Rechazadas",
        cell: ({ row }) => (
          <span
            className={cn(
              "tabular-nums text-xs",
              (row.original.rowsRejected ?? 0) > 0 &&
                "text-[var(--color-warning)] font-medium",
            )}
          >
            {row.original.rowsRejected != null
              ? formatNumber(row.original.rowsRejected)
              : "—"}
          </span>
        ),
      },
      {
        id: "error",
        header: "",
        cell: ({ row }) =>
          row.original.error ? (
            <span
              title={row.original.error}
              className="inline-flex max-w-[180px] items-center gap-1 rounded border border-[color-mix(in_oklab,var(--color-destructive)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,transparent)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-destructive)]"
            >
              <AlertTriangle aria-hidden className="h-3 w-3" />
              <span className="truncate">Ver error</span>
            </span>
          ) : null,
      },
      {
        id: "retry",
        header: "",
        cell: ({ row }) =>
          row.original.status === "failed" && row.original.table ? (
            <Link
              href={`/etl-monitor/lanzar?fact=${encodeURIComponent(row.original.table)}`}
              aria-label={`Relanzar ${row.original.name}`}
              className="inline-flex items-center gap-0.5 text-xs text-[var(--color-warning)] hover:underline"
            >
              <RotateCcw aria-hidden className="h-3 w-3" />
              Relanzar
            </Link>
          ) : null,
      },
      {
        id: "detail",
        header: "",
        cell: ({ row }) =>
          row.original.corridaId ? (
            <Link
              href={`/etl-monitor/${row.original.corridaId}`}
              aria-label={`Ver detalle de ${row.original.name}`}
              className="inline-flex items-center gap-0.5 text-xs text-[var(--color-primary)] hover:underline"
            >
              Detalle
              <ChevronRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span
              className="text-xs text-[var(--color-text-muted)]"
              title="Sin corrida del control-plane asociada"
            >
              —
            </span>
          ),
      },
    ],
    [],
  );

  return (
    <section aria-label="Historial de corridas" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span>Mostrar últimas</span>
          <div
            role="group"
            aria-label="Cantidad de corridas a mostrar"
            className="flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]"
          >
            {LIMIT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setUrlState({ limit: n })}
                aria-pressed={limit === n}
                className={cn(
                  "px-2.5 py-1 text-xs tabular-nums transition",
                  limit === n
                    ? "bg-[var(--color-primary-solid)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          {isFetching ? (
            <span className="flex items-center gap-1">
              <RefreshCw aria-hidden className="h-3 w-3 animate-spin" />
              Refrescando…
            </span>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          aria-label="Refrescar historial"
        >
          <RefreshCw aria-hidden className="h-3.5 w-3.5" />
          Refrescar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 rounded-md" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-md" />
          ))}
        </div>
      ) : isError || !data ? (
        isUnauthorizedError(error) ? null : (
          <ErrorPanel
            message={
              error instanceof Error ? error.message : "El backend no respondió."
            }
            onRetry={() => refetch()}
          />
        )
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchKey="name"
          searchPlaceholder="Buscar proceso…"
          emptyMessage="Sin corridas en el rango seleccionado"
        />
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/etl-control/tabs/history-tab.tsx"
git commit -m "feat(etl-control): history-tab unifies ETL monitor history + audit using useEtlRuns"
```

---

## Task 6: Create `app/(admin)/etl-control/tabs/bitacora-tab.tsx`

**Files:**
- Create: `app/(admin)/etl-control/tabs/bitacora-tab.tsx`

Port de `BitacoraClient` sin el `PageHeader` (ya está en `page.tsx`). Reemplaza `EmptyState`/`ErrorBlock` inline con los genéricos. Usa `formatDuration` en vez de `fmtDur`.

- [ ] **Step 1: Create the file**

```tsx
// app/(admin)/etl-control/tabs/bitacora-tab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  FileSearch,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { KpiCard } from "@/components/charts/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorPanel } from "@/components/ui/error-panel";
import { cn } from "@/lib/utils";
import { formatDateTime, formatDuration, formatNumber, formatPercent } from "@/lib/format";
import {
  useBitacoraList,
  useBitacoraResumen,
  type VentanaResumen,
} from "@/hooks/use-bitacora";
import {
  BitacoraEstado,
  type BitacoraEntry,
} from "@/lib/schemas/bitacora";
import { BitacoraStatusBadge } from "@/components/control-center/bitacora-status-badge";
import { BitacoraDetailDrawer } from "@/components/control-center/bitacora-detail-drawer";
import { Pagination } from "@/components/ui/pagination";
import { useUrlState } from "@/hooks/use-url-state";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

const ESTADOS_FILTRABLES: ReadonlyArray<BitacoraEstado> = [
  "OK",
  "ERROR",
  "EN_PROCESO",
  "SKIPPED",
  "TIMEOUT",
] as const;

const VENTANAS: ReadonlyArray<{ valor: VentanaResumen; label: string }> = [
  { valor: 1, label: "Hoy" },
  { valor: 7, label: "7 días" },
  { valor: 30, label: "30 días" },
] as const;

type BitacoraView = "por-corrida" | "por-tabla";

export function BitacoraTab() {
  const [urlState, setUrlState] = useUrlState({
    btab: "por-corrida",
    bpage: 1,
    bpageSize: 50,
    btabla: "",
  });

  const view: BitacoraView = (
    ["por-corrida", "por-tabla"] as BitacoraView[]
  ).includes(urlState.btab as BitacoraView)
    ? (urlState.btab as BitacoraView)
    : "por-corrida";
  const page = urlState.bpage;
  const pageSize = (PAGE_SIZE_OPTIONS.includes(urlState.bpageSize as PageSize)
    ? urlState.bpageSize
    : 50) as PageSize;
  const tableQuery = urlState.btabla as string;

  function setView(v: BitacoraView) { setUrlState({ btab: v }); }
  function setPage(p: number) { setUrlState({ bpage: p }); }
  function setPageSize(n: number) { setUrlState({ bpageSize: n, bpage: 1 }); }

  const [ventana, setVentana] = useState<VentanaResumen>(7);
  const [estadosSel, setEstadosSel] = useState<Set<BitacoraEstado>>(new Set());
  const [tableInput, setTableInput] = useState(() => tableQuery);
  const [detailId, setDetailId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setUrlState({ btabla: tableInput.trim() || null, bpage: 1 });
    }, 300);
    return () => clearTimeout(t);
  }, [tableInput, setUrlState]);

  const resumen = useBitacoraResumen(ventana);
  const list = useBitacoraList({
    pagina: page,
    tamano: pageSize,
    estado: estadosSel.size > 0 ? Array.from(estadosSel) : null,
    tabla: tableQuery || null,
  });

  const items = useMemo<BitacoraEntry[]>(
    () => list.data?.items ?? [],
    [list.data],
  );
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const filtrosActivos = estadosSel.size > 0 || tableQuery.length > 0;

  function toggleEstado(e: BitacoraEstado) {
    setEstadosSel((prev) => {
      const next = new Set(prev);
      if (next.has(e)) next.delete(e);
      else next.add(e);
      return next;
    });
    setPage(1);
  }

  function clearFilters() {
    setEstadosSel(new Set());
    setTableInput("");
    setUrlState({ btabla: null, bpage: 1 });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Resumen KPIs por ventana */}
      <section
        aria-label={`Resumen ${VENTANAS.find((v) => v.valor === ventana)?.label}`}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-3">
          <VentanaSwitcher value={ventana} onChange={setVentana} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => list.refetch()}
            aria-label="Refrescar"
            className="gap-1.5"
          >
            <RefreshCw
              aria-hidden
              className={cn("h-4 w-4", list.isFetching && "animate-spin")}
            />
            Refrescar
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Tasa de éxito"
            value={resumen.data ? formatPercent(resumen.data.tasaExitoPct) : "—"}
            icon={CheckCircle2}
            tone={
              !resumen.data
                ? "default"
                : resumen.data.tasaExitoPct >= 95
                  ? "success"
                  : resumen.data.tasaExitoPct >= 80
                    ? "warning"
                    : "destructive"
            }
          />
          <KpiCard
            label="Cargas totales"
            value={resumen.data ? formatNumber(resumen.data.total) : "—"}
            icon={Activity}
            tone="info"
          />
          <KpiCard
            label="Filas insertadas"
            value={resumen.data ? formatNumber(resumen.data.filasOk) : "—"}
            icon={Database}
            tone="default"
          />
          <KpiCard
            label="Errores"
            value={resumen.data ? formatNumber(resumen.data.errores) : "—"}
            icon={ShieldAlert}
            tone={
              !resumen.data
                ? "default"
                : resumen.data.errores > 0
                  ? "destructive"
                  : "success"
            }
          />
        </div>
      </section>

      {/* Tabs por-corrida / por-tabla */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
        <ViewButton active={view === "por-corrida"} onClick={() => setView("por-corrida")}>
          Por corrida
        </ViewButton>
        <ViewButton active={view === "por-tabla"} onClick={() => setView("por-tabla")}>
          Por tabla
        </ViewButton>
      </div>

      {/* Toolbar de filtros */}
      <section
        aria-label="Filtros"
        className="flex flex-col gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <Input
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
              placeholder="Filtrar por tabla destino…"
              aria-label="Filtrar por tabla destino"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <Filter aria-hidden className="h-3.5 w-3.5" />
              Estado
            </span>
            {ESTADOS_FILTRABLES.map((e) => (
              <EstadoChip
                key={e}
                estado={e}
                active={estadosSel.has(e)}
                onClick={() => toggleEstado(e)}
              />
            ))}
          </div>
          {filtrosActivos ? (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
              <X aria-hidden className="h-3.5 w-3.5" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </section>

      {/* Contenido */}
      {list.isError ? (
        <ErrorPanel
          message={
            list.error instanceof Error
              ? list.error.message
              : "Error al cargar la bitácora"
          }
          onRetry={() => list.refetch()}
        />
      ) : list.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title={filtrosActivos ? "Sin resultados para los filtros aplicados" : "No hay cargas registradas todavía"}
          description={
            filtrosActivos
              ? "Prueba quitando algún filtro o ampliando la búsqueda por tabla."
              : "Cuando el ETL ejecute por primera vez verás aquí cada tabla cargada y su estado."
          }
          action={
            filtrosActivos ? (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                <X aria-hidden className="h-3.5 w-3.5" />
                Limpiar filtros
              </Button>
            ) : undefined
          }
        />
      ) : view === "por-corrida" ? (
        <PorCorridaTable items={items} onOpen={setDetailId} />
      ) : (
        <PorTablaTable items={items} onOpen={setDetailId} />
      )}

      {/* Paginación */}
      {!list.isLoading && items.length > 0 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      ) : null}

      <BitacoraDetailDrawer idLog={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function VentanaSwitcher({
  value,
  onChange,
}: {
  value: VentanaResumen;
  onChange: (v: VentanaResumen) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Ventana de resumen"
      className="inline-flex w-fit items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
    >
      {VENTANAS.map((v) => (
        <button
          key={v.valor}
          type="button"
          role="radio"
          aria-checked={value === v.valor}
          onClick={() => onChange(v.valor)}
          className={cn(
            "min-h-[34px] rounded px-3 text-xs font-medium transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
            value === v.valor
              ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]",
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "min-h-[40px] px-4 text-sm font-medium transition focus-visible:outline-none",
        active
          ? "border-b-2 border-[var(--color-primary)] text-[var(--color-text)]"
          : "border-b-2 border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
      )}
    >
      {children}
    </button>
  );
}

const ESTADO_STYLE: Record<BitacoraEstado, { activeClass: string; dot: string }> = {
  OK: {
    activeClass:
      "border-[var(--color-success)] bg-[color-mix(in_oklab,var(--color-success)_15%,transparent)] text-[var(--color-success)]",
    dot: "bg-[var(--color-success)]",
  },
  ERROR: {
    activeClass:
      "border-[var(--color-destructive)] bg-[color-mix(in_oklab,var(--color-destructive)_15%,transparent)] text-[var(--color-destructive)]",
    dot: "bg-[var(--color-destructive)]",
  },
  EN_PROCESO: {
    activeClass:
      "border-[var(--color-primary)] bg-[color-mix(in_oklab,var(--color-primary)_15%,transparent)] text-[var(--color-text)]",
    dot: "bg-[var(--color-primary)]",
  },
  SKIPPED: {
    activeClass:
      "border-[var(--color-text-muted)] bg-[color-mix(in_oklab,var(--color-text-muted)_10%,transparent)] text-[var(--color-text-muted)]",
    dot: "bg-[var(--color-text-muted)]",
  },
  TIMEOUT: {
    activeClass:
      "border-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_15%,transparent)] text-[var(--color-warning)]",
    dot: "bg-[var(--color-warning)]",
  },
};

function EstadoChip({
  estado,
  active,
  onClick,
}: {
  estado: BitacoraEstado;
  active: boolean;
  onClick: () => void;
}) {
  const label = (
    {
      OK: "OK",
      ERROR: "Error",
      EN_PROCESO: "En proceso",
      SKIPPED: "Omitido",
      TIMEOUT: "Timeout",
    } as const
  )[estado];
  const { activeClass, dot } = ESTADO_STYLE[estado];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-[28px] items-center rounded-full border px-2.5 text-[11px] font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
        active
          ? activeClass
          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]",
      )}
    >
      <span
        className={cn(
          "mr-1 inline-block h-1.5 w-1.5 rounded-full",
          dot,
          active ? "opacity-100" : "opacity-40",
        )}
        aria-hidden
      />
      {label}
    </button>
  );
}

interface TableProps {
  items: BitacoraEntry[];
  onOpen: (idLog: number) => void;
}

function PorCorridaTable({ items, onOpen }: TableProps) {
  const groups = useMemo(() => {
    const map = new Map<string, BitacoraEntry[]>();
    for (const it of items) {
      const k = it.idCorrida ?? "__sin_corrida__";
      const arr = map.get(k);
      if (arr) arr.push(it);
      else map.set(k, [it]);
    }
    return Array.from(map.entries()).map(([key, entries]) => ({ key, entries }));
  }, [items]);

  return (
    <div className="flex flex-col gap-2">
      {groups.map((g) => (
        <CorridaGroup
          key={g.key}
          idCorrida={g.key === "__sin_corrida__" ? null : g.key}
          entries={g.entries}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

function CorridaGroup({
  idCorrida,
  entries,
  onOpen,
}: {
  idCorrida: string | null;
  entries: BitacoraEntry[];
  onOpen: (id: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const ok = entries.filter((e) => e.estado === "OK").length;
  const err = entries.filter((e) => e.estado === "ERROR").length;
  const running = entries.filter((e) => e.estado === "EN_PROCESO").length;
  const totalFilas = entries.reduce((acc, e) => acc + e.filasInsertadas, 0);
  const fechaInicio = entries
    .map((e) => e.fechaInicio)
    .filter((v): v is string => Boolean(v))
    .sort()[0];

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-3 px-3 py-2.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
        )}
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition",
            !open && "-rotate-90",
          )}
        />
        <div className="flex flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            Corrida
          </span>
          <span className="font-mono text-sm font-medium text-[var(--color-text)]">
            {idCorrida ?? "sin asociar"}
          </span>
          {fechaInicio ? (
            <span className="text-xs text-[var(--color-text-muted)]">
              {formatDateTime(fechaInicio)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-[var(--color-surface-2)] px-2 py-0.5 tabular-nums text-[var(--color-text-secondary)]">
            {entries.length} {entries.length === 1 ? "tabla" : "tablas"}
          </span>
          {ok > 0 && (
            <span className="text-[var(--color-success)] tabular-nums">{ok} OK</span>
          )}
          {running > 0 && (
            <span className="text-[var(--color-info)] tabular-nums">{running} activas</span>
          )}
          {err > 0 && (
            <span className="text-[var(--color-destructive)] tabular-nums">{err} ERROR</span>
          )}
          <span className="text-[var(--color-text-muted)] tabular-nums">
            {formatNumber(totalFilas)} filas
          </span>
        </div>
      </summary>
      <div className="border-t border-[var(--color-border)]">
        <PorTablaTable items={entries} onOpen={onOpen} embedded />
      </div>
    </details>
  );
}

function PorTablaTable({
  items,
  onOpen,
  embedded,
}: TableProps & { embedded?: boolean }) {
  return (
    <div
      className={cn(
        "overflow-x-auto",
        !embedded &&
          "rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]",
      )}
    >
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          <tr>
            <th className="px-3 py-2 font-medium">Tabla</th>
            <th className="px-3 py-2 font-medium">Estado</th>
            <th className="px-3 py-2 text-right font-medium">Filas OK</th>
            <th className="px-3 py-2 text-right font-medium">Rechazadas</th>
            <th className="px-3 py-2 font-medium">Inicio</th>
            <th className="px-3 py-2 text-right font-medium">Duración</th>
            <th className="px-3 py-2 font-medium">Proceso</th>
            <th className="px-3 py-2 sr-only">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr
              key={it.idLog}
              className="border-t border-[var(--color-border)] transition hover:bg-[var(--color-surface-2)]/60"
            >
              <td className="px-3 py-2 font-mono text-[13px]">{it.tablaDestino}</td>
              <td className="px-3 py-2">
                <BitacoraStatusBadge estado={it.estado} />
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatNumber(it.filasInsertadas)}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right tabular-nums",
                  it.filasRechazadas > 0
                    ? "text-[var(--color-destructive)]"
                    : "text-[var(--color-text-muted)]",
                )}
              >
                {formatNumber(it.filasRechazadas)}
              </td>
              <td className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
                {it.fechaInicio ? formatDateTime(it.fechaInicio) : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-[var(--color-text-secondary)]">
                {formatDuration(it.duracionSegundos)}
              </td>
              <td
                className="max-w-[180px] truncate px-3 py-2 text-xs text-[var(--color-text-muted)]"
                title={it.nombreProceso}
              >
                {it.nombreProceso}
              </td>
              <td className="px-3 py-2 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpen(it.idLog)}
                  className="h-7 gap-1 px-2 text-xs"
                  aria-label={`Ver detalle del log ${it.idLog}`}
                >
                  Detalle
                  <ChevronRight aria-hidden className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**NOTA CLAVE para el implementador:** La `BitacoraTab` usa keys de URL con prefijo `b` (`btab`, `bpage`, `bpageSize`, `btabla`) para evitar colisiones con los params del tab padre (`?tab=bitacora`) que usa `etl-control-client.tsx`.

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/etl-control/tabs/bitacora-tab.tsx"
git commit -m "feat(etl-control): bitacora-tab port using generic EmptyState/ErrorPanel and formatDuration"
```

---

## Task 7: Create `app/(admin)/etl-control/etl-control-client.tsx`

**Files:**
- Create: `app/(admin)/etl-control/etl-control-client.tsx`

Contenedor de las 3 pestañas con sincronización en la URL via `?tab=live|history|bitacora`.

- [ ] **Step 1: Create the file**

```tsx
// app/(admin)/etl-control/etl-control-client.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, BookText, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveCorridas } from "@/hooks/use-control-center";
import { LiveTab } from "./tabs/live-tab";
import { HistoryTab } from "./tabs/history-tab";
import { BitacoraTab } from "./tabs/bitacora-tab";

type EtlTab = "live" | "history" | "bitacora";

const VALID_TABS: readonly EtlTab[] = ["live", "history", "bitacora"];

export function EtlControlClient() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const tabParam = search.get("tab");
  const tab: EtlTab = VALID_TABS.includes(tabParam as EtlTab)
    ? (tabParam as EtlTab)
    : "live";

  const activeQuery = useActiveCorridas();
  const liveCount = activeQuery.data?.length ?? 0;

  const setTab = (next: EtlTab) => {
    const sp = new URLSearchParams(search.toString());
    if (next === "live") sp.delete("tab");
    else sp.set("tab", next);
    const qs = sp.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as EtlTab)}
      className="flex flex-col gap-4"
    >
      <TabsList className="self-start">
        <TabsTrigger value="live" className="gap-1.5">
          <Activity aria-hidden className="h-3.5 w-3.5" />
          En vivo
          {liveCount > 0 && (
            <span
              aria-label={`${liveCount} corridas activas`}
              className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-[10px] font-semibold tabular-nums text-[var(--color-primary-foreground)]"
            >
              {liveCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-1.5">
          <History aria-hidden className="h-3.5 w-3.5" />
          Historial
        </TabsTrigger>
        <TabsTrigger value="bitacora" className="gap-1.5">
          <BookText aria-hidden className="h-3.5 w-3.5" />
          Bitácora
        </TabsTrigger>
      </TabsList>

      <TabsContent value="live" className="mt-0">
        <LiveTab />
      </TabsContent>
      <TabsContent value="history" className="mt-0">
        <HistoryTab />
      </TabsContent>
      <TabsContent value="bitacora" className="mt-0">
        <BitacoraTab />
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/etl-control/etl-control-client.tsx"
git commit -m "feat(etl-control): EtlControlClient tab container with URL sync"
```

---

## Task 8: Create `app/(admin)/etl-control/page.tsx`

**Files:**
- Create: `app/(admin)/etl-control/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
// app/(admin)/etl-control/page.tsx
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { EtlControlClient } from "./etl-control-client";

export const metadata: Metadata = { title: "Control ETL" };

export default function EtlControlPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Control ETL"
        description="Monitor en vivo, historial de corridas y bitácora detallada de cargas."
      />
      <EtlControlClient />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/etl-control/page.tsx"
git commit -m "feat(etl-control): page.tsx server component with metadata and PageHeader"
```

---

## Task 9: Update `lib/routes.ts`

**Files:**
- Modify: `lib/routes.ts`

Tres cambios:
1. Añadir `etlControl` → `/etl-control` en "operaciones"
2. Marcar `etlMonitor` con `hideFromNav: true` (mantiene RBAC coverage para sub-rutas `/etl-monitor/lanzar` y `/etl-monitor/[id]`)
3. Eliminar las entradas `bitacora` y `audit` del manifest

- [ ] **Step 1: Apply changes**

Reemplaza el bloque `ROUTES` en `lib/routes.ts`. Los cambios son:

**Añadir** (después de `etlMonitor`):
```typescript
etlControl: {
  path: "/etl-control",
  label: "Control ETL",
  icon: Workflow,
  roles: [ADMIN, ANALYST],
  section: "operaciones",
  description: "Monitor en vivo, historial de corridas y bitácora de cargas ETL.",
},
```

**Modificar** `etlMonitor` (añadir `hideFromNav: true`, preservar RBAC):
```typescript
etlMonitor: {
  path: "/etl-monitor",
  label: "Monitor ETL",
  icon: Workflow,
  roles: [ADMIN, ANALYST],
  hideFromNav: true,   // ← añadir esta línea
  description: "Estado de corridas ETL en curso e histórico.",
},
```

**Eliminar** los bloques `bitacora` y `audit` completamente del objeto `ROUTES`.

El resultado final del objeto `ROUTES` debe ser:

```typescript
export const ROUTES = {
  dashboard: {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: [ADMIN],
    section: "operaciones",
    description: "Vista operativa del ecosistema de datos.",
  },
  overview: {
    path: "/overview",
    label: "Visión ejecutiva",
    icon: Telescope,
    roles: [EXECUTIVE, ADMIN],
    section: "gobierno",
    description: "Indicadores agregados para decisión.",
  },
  etlMonitor: {
    path: "/etl-monitor",
    label: "Monitor ETL",
    icon: Workflow,
    roles: [ADMIN, ANALYST],
    hideFromNav: true,
    description: "Estado de corridas ETL en curso e histórico.",
  },
  etlControl: {
    path: "/etl-control",
    label: "Control ETL",
    icon: Workflow,
    roles: [ADMIN, ANALYST],
    section: "operaciones",
    description: "Monitor en vivo, historial de corridas y bitácora de cargas ETL.",
  },
  dwh: {
    path: "/dwh",
    label: "DWH Explorer",
    icon: Network,
    roles: [ADMIN],
    section: "operaciones",
    description: "Catálogo de tablas, columnas y lineage.",
  },
  quality: {
    path: "/quality",
    label: "Gobierno y Calidad",
    icon: ShieldCheck,
    roles: [ADMIN, ANALYST],
    section: "operaciones",
    description: "Dashboard de calidad, cuarentena, homologación y reinyección de datos.",
  },
  alerts: {
    path: "/alerts",
    label: "Alertas",
    icon: ShieldAlert,
    roles: [ADMIN, ANALYST],
    section: "operaciones",
    description: "Eventos accionables del portal y backend.",
  },
  home: {
    path: "/home",
    label: "Mi Workspace",
    icon: Home,
    roles: [ANALYST],
    section: "analisis",
    description: "Workspace analítico con widgets configurables.",
  },
  notifications: {
    path: "/notifications",
    label: "Notificaciones",
    icon: Bell,
    roles: [ANALYST, ADMIN],
    section: "analisis",
    description: "Alertas ETL y calidad de datos.",
  },
  explore: {
    path: "/explore",
    label: "Exploración DWH",
    icon: Compass,
    roles: [ANALYST, ADMIN],
    section: "analisis",
  },
  models: {
    path: "/models",
    label: "Modelos",
    icon: FlaskConical,
    roles: [ANALYST, ADMIN],
    section: "analisis",
  },
  proyecciones: {
    path: "/proyecciones",
    label: "Proyecciones",
    icon: Sprout,
    roles: [ANALYST, ADMIN],
    section: "analisis",
    description: "Motor Six-Week: kg proyectados por semana a partir de conteos fenológicos.",
  },
  reports: {
    path: "/reports",
    label: "Reportes",
    icon: FileText,
    roles: [ANALYST, ADMIN],
    section: "gobierno",
  },
  catalogos: {
    path: "/catalogos",
    label: "Catálogos",
    icon: Database,
    roles: [ADMIN, ANALYST],
    section: "gobierno",
  },
  configuracion: {
    path: "/configuracion",
    label: "Configuración",
    icon: Settings,
    roles: [ADMIN],
    section: "gobierno",
  },
} as const satisfies Record<string, RouteDef>;
```

También verificar que el import de `History` de lucide-react ya no sea necesario (lo usaban `bitacora` y `audit`). Si ninguna otra ruta lo usa, eliminarlo del import.

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: zero errors. Si TS se queja de `RouteKey` siendo usado en algún otro archivo con `"bitacora"` o `"audit"`, buscar y actualizar esas referencias.

```bash
grep -r '"bitacora"\|"audit"\|etlMonitor\|ROUTES\.bitacora\|ROUTES\.audit' app/ components/ lib/ --include="*.ts" --include="*.tsx" | grep -v "lib/routes.ts" | grep -v "node_modules"
```

Si aparecen referencias, actualizarlas a `"etlControl"` o eliminarlas.

- [ ] **Step 3: Commit**

```bash
git add lib/routes.ts
git commit -m "refactor(routes): add etlControl, hide etlMonitor, remove bitacora+audit entries"
```

---

## Task 10: Delete old route files

**Files:**
- Delete: `app/(admin)/etl-monitor/page.tsx`
- Delete: `app/(admin)/etl-monitor/etl-monitor-client.tsx`
- Delete: `app/(admin)/etl-monitor/loading.tsx`
- Delete: `app/(admin)/audit/page.tsx`
- Delete: `app/(admin)/audit/etl-audit-client.tsx`
- Delete: `app/(admin)/bitacora/page.tsx`
- Delete: `app/(admin)/bitacora/bitacora-client.tsx`

**Preservar intactos** (no tocar):
- `app/(admin)/etl-monitor/lanzar/`
- `app/(admin)/etl-monitor/[id]/`

- [ ] **Step 1: Verify no remaining imports from deleted files**

```bash
grep -r "etl-monitor-client\|etl-audit-client\|bitacora-client" app/ components/ --include="*.ts" --include="*.tsx"
```
Expected: zero results (los nuevos tabs importan directamente desde `@/hooks/`, `@/components/`, etc.)

- [ ] **Step 2: Delete the files**

```bash
git rm "app/(admin)/etl-monitor/page.tsx"
git rm "app/(admin)/etl-monitor/etl-monitor-client.tsx"
git rm "app/(admin)/etl-monitor/loading.tsx"
git rm "app/(admin)/audit/page.tsx"
git rm "app/(admin)/audit/etl-audit-client.tsx"
git rm "app/(admin)/bitacora/page.tsx"
git rm "app/(admin)/bitacora/bitacora-client.tsx"
```

- [ ] **Step 3: Verify TypeScript after deletions**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(etl-control): remove legacy etl-monitor/audit/bitacora page files"
```

---

## Task 11: Build verification

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 2: Production build**

```bash
npm run build
```
Expected: Build exitoso sin errores. Warnings sobre `console.error` o `any` son aceptables.

Si el build falla por rutas faltantes (Next.js puede quejarse de páginas eliminadas), verificar que no haya links hardcodeados a `/audit` o `/bitacora` en otros archivos:

```bash
grep -r '"/audit"\|"/bitacora"\|href="/etl-monitor"' app/ components/ --include="*.tsx" --include="*.ts"
```

Actualizar cualquier link encontrado a `/etl-control`.

- [ ] **Step 3: Commit si hubo fixes**

```bash
git add -A
git commit -m "fix(etl-control): update internal links to /etl-control after route consolidation"
```

---

## Self-Review

### Spec coverage

| Requisito del spec | Tarea |
|---|---|
| Ruta unificada `/etl-control` | Task 8 (page.tsx) |
| "Control ETL" en sidebar | Task 9 (routes.ts) |
| Tab "En vivo" (LiveTab) | Task 4 |
| Tab "Historial de Corridas" (unifica Monitor + Auditoría) | Task 5 |
| Tab "Bitácora" (bitácora detallada) | Task 6 |
| `EmptyState` genérico en `@/components/ui/` | Task 2 |
| `ErrorPanel` genérico en `@/components/ui/` | Task 3 |
| `formatDuration` en `lib/format.ts` | Task 1 |
| Eliminar `STATUS_CONFIG` duplicado de audit | Task 10 (borrar etl-audit-client.tsx) |
| Eliminar `fmtDur` local de bitácora | Task 6 (usa `formatDuration`) |
| Eliminar `EmptyLive`/`ErrorPanel` locales de etl-monitor | Task 4 (usa genéricos) |
| Eliminar `EmptyState`/`ErrorBlock` locales de bitácora | Task 6 (usa genéricos) |
| Eliminar rutas antiguas del manifest | Task 9 |
| Eliminar archivos muertos | Task 10 |
| RBAC preservada para sub-rutas `/etl-monitor/lanzar` y `[id]` | Task 9 (`hideFromNav: true`) |
| Build verde | Task 11 |

### Placeholder scan
Sin TBD, TODO ni "similar al task anterior". Cada step tiene código completo.

### Type consistency

- `LiveTab` exportada desde `./tabs/live-tab` — importada en `etl-control-client.tsx` ✅
- `HistoryTab` exportada desde `./tabs/history-tab` — importada en `etl-control-client.tsx` ✅
- `BitacoraTab` exportada desde `./tabs/bitacora-tab` — importada en `etl-control-client.tsx` ✅
- `formatDuration(sec: number | null): string` — usada en history-tab y bitacora-tab ✅
- `EmptyState({ icon, title, description?, action?, className? })` — usada en live-tab y bitacora-tab ✅
- `ErrorPanel({ message, onRetry })` — usada en live-tab, history-tab, bitacora-tab ✅
- `EtlRun` importado desde `@/lib/schemas/control-center` en history-tab ✅
- `BitacoraEntry` importado desde `@/lib/schemas/bitacora` en bitacora-tab ✅
- URL state keys en bitacora-tab usan prefijo `b` para evitar colisión con `?tab=` del contenedor ✅
