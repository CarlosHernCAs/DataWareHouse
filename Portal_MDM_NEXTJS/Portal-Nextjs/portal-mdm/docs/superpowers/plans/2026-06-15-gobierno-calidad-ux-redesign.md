# Gobierno y Calidad — UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la página "Gobierno y Calidad" en una experiencia unificada e intuitiva: pipeline visual de flujo de datos, cuarentena agrupada por tabla, homologación con split de confianza + progress bar + sticky action bar.

**Architecture:** Se introduce `QualityShell` (client) que posee el estado del tab activo y sirve de puente entre los datos SSR de `page.tsx` y los subcomponentes. Un nuevo `PipelineHeader` actúa como navegación primaria mostrando el flujo de datos. Los subcomponentes de cuarentena y homologación se refactorizan internamente sin cambiar la capa de API/hooks.

**Tech Stack:** Next.js 14 App Router, shadcn/ui, Tailwind CSS, lucide-react, recharts, @tanstack/react-query

---

## File Map

| Acción   | Archivo                                              | Responsabilidad                                                         |
|----------|------------------------------------------------------|-------------------------------------------------------------------------|
| CREATE   | `app/(admin)/quality/pipeline-header.tsx`            | Strip visual de flujo de pipeline con stages clickeables                |
| CREATE   | `app/(admin)/quality/quality-shell.tsx`              | Wrapper cliente: posee estado de tab, renderiza header + tabs           |
| MODIFY   | `app/(admin)/quality/page.tsx`                       | Solo fetch → renderiza `QualityShell` con los props correctos           |
| MODIFY   | `app/(admin)/quality/quarantine-table.tsx`           | Agrupa registros por `tabla_origen`, secciones colapsables              |
| MODIFY   | `app/(admin)/quality/homologation-client.tsx`        | Split alta/baja confianza + progress bar + sticky action bar            |
| DELETE   | `app/(admin)/quality/quality-client.tsx`             | Muerto: no es importado por ningún archivo activo                       |

---

## Task 1: Create `pipeline-header.tsx`

**Files:**
- Create: `app/(admin)/quality/pipeline-header.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/(admin)/quality/pipeline-header.tsx
import { ArrowRight, GitPullRequestArrow, ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineHeaderProps {
  cuarentenaTotal: number;
  cuarentenaPendiente: number;
  homologandoCount: number;
  reinyeccionCount: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

type Tone = "neutral" | "warning" | "primary" | "success";

const TONE_BORDER: Record<Tone, string> = {
  neutral: "border-[var(--color-border)] bg-[var(--color-surface-2)]",
  warning: "border-amber-500/30 bg-amber-500/8",
  primary: "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/8",
  success: "border-emerald-500/30 bg-emerald-500/8",
};
const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-[var(--color-text-muted)]",
  warning: "text-amber-400",
  primary: "text-[var(--color-primary)]",
  success: "text-emerald-400",
};

interface Stage {
  id: string;
  label: string;
  count: number;
  sublabel: string;
  icon: React.ElementType;
  tone: Tone;
  tab: string;
}

export function PipelineHeader({
  cuarentenaTotal,
  cuarentenaPendiente,
  homologandoCount,
  reinyeccionCount,
  activeTab,
  onTabChange,
}: PipelineHeaderProps) {
  const stages: Stage[] = [
    {
      id: "quarantine",
      label: "Cuarentena",
      count: cuarentenaTotal,
      sublabel: `${cuarentenaPendiente} pendientes`,
      icon: ShieldAlert,
      tone: cuarentenaPendiente > 0 ? "warning" : "success",
      tab: "quarantine",
    },
    {
      id: "homologation",
      label: "Homologación",
      count: homologandoCount,
      sublabel: "en revisión",
      icon: GitPullRequestArrow,
      tone: homologandoCount > 0 ? "primary" : "neutral",
      tab: "homologation",
    },
    {
      id: "reinject",
      label: "Re-inyección",
      count: reinyeccionCount,
      sublabel: "listos para ETL",
      icon: Zap,
      tone: reinyeccionCount > 0 ? "success" : "neutral",
      tab: "homologation",
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1" role="navigation" aria-label="Flujo de datos">
      {stages.map((stage, i) => {
        const Icon = stage.icon;
        const isActive = stage.tab === activeTab;
        return (
          <div key={stage.id} className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onTabChange(stage.tab)}
              aria-pressed={isActive}
              aria-label={`Ir a ${stage.label}: ${stage.count} ${stage.sublabel}`}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-5 py-3 text-center transition-all cursor-pointer hover:brightness-110",
                TONE_BORDER[stage.tone],
                isActive && "ring-2 ring-[var(--color-primary)]/40 shadow-md",
              )}
            >
              <Icon className={cn("h-5 w-5", TONE_TEXT[stage.tone])} aria-hidden />
              <span className={cn("text-2xl font-bold tabular-nums leading-none", TONE_TEXT[stage.tone])}>
                {stage.count}
              </span>
              <span className="text-xs font-semibold text-[var(--color-text)]">
                {stage.label}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                {stage.sublabel}
              </span>
            </button>
            {i < stages.length - 1 && (
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-border)]" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: No errors related to the new file.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/quality/pipeline-header.tsx"
git commit -m "feat(quality): add PipelineHeader visual pipeline flow component"
```

---

## Task 2: Create `quality-shell.tsx`

**Files:**
- Create: `app/(admin)/quality/quality-shell.tsx`

Client wrapper que posee el estado de tab activo y conecta el server data con los subcomponentes.

- [ ] **Step 1: Create the component**

```tsx
// app/(admin)/quality/quality-shell.tsx
"use client";

import { useState } from "react";
import { GitPullRequestArrow, LayoutDashboard, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PipelineHeader } from "./pipeline-header";
import { QuarantineTable } from "./quarantine-table";
import { HomologationClient } from "./homologation-client";
import {
  QualityByEntityChart,
  QualityGaugeWithData,
  QualityKpiSection,
  QualityTrendChart,
} from "./quality-charts";
import type { QuarantineRecord } from "@/lib/schemas/quarantine";
import type { HomologationRecord } from "@/lib/schemas/homologation";

interface QualityShellProps {
  cuarentenaTotal: number;
  cuarentenaPendiente: number;
  reinyeccionCount: number;
  initialQuarantineData: QuarantineRecord[];
  pendingHomologations: HomologationRecord[];
  isReadOnly: boolean;
}

export function QualityShell({
  cuarentenaTotal,
  cuarentenaPendiente,
  reinyeccionCount,
  initialQuarantineData,
  pendingHomologations,
  isReadOnly,
}: QualityShellProps) {
  const [tab, setTab] = useState("dashboard");
  const homologandoCount = pendingHomologations.length;

  return (
    <div className="flex flex-col gap-6">
      <PipelineHeader
        cuarentenaTotal={cuarentenaTotal}
        cuarentenaPendiente={cuarentenaPendiente}
        homologandoCount={homologandoCount}
        reinyeccionCount={reinyeccionCount}
        activeTab={tab}
        onTabChange={setTab}
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full max-w-[640px] grid-cols-3">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="quarantine" className="gap-2">
            <ShieldAlert className="h-4 w-4" aria-hidden />
            Cuarentena
            {cuarentenaPendiente > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-4 min-w-[18px] px-1 text-[10px] font-bold"
              >
                {cuarentenaPendiente}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="homologation" className="gap-2">
            <GitPullRequestArrow className="h-4 w-4" aria-hidden />
            Homologación
            {homologandoCount > 0 && (
              <Badge className="ml-1 h-4 min-w-[18px] px-1 text-[10px] font-bold bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                {homologandoCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Dashboard ───────────────────────────────────────── */}
        <TabsContent value="dashboard" className="mt-4 flex flex-col gap-4">
          <section
            aria-label="KPIs de calidad"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <QualityKpiSection />
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Calidad por tabla</CardTitle>
                <CardDescription>
                  Cuarentena por tabla origen — pendientes / resueltos / descartados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QualityByEntityChart />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Score global</CardTitle>
                <CardDescription>
                  Indicador agregado de calidad maestra.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <QualityGaugeWithData />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolución de Errores</CardTitle>
              <CardDescription>
                Filas insertadas vs. rechazadas por día en la bitácora de carga.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QualityTrendChart />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Cuarentena ──────────────────────────────────────── */}
        <TabsContent value="quarantine" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle>Registros Rechazados</CardTitle>
                <CardDescription>
                  Datos que no superaron las reglas de validación, agrupados por tabla.
                </CardDescription>
              </div>
              {cuarentenaTotal > 0 && (
                <Badge variant="destructive" className="animate-pulse w-fit">
                  {cuarentenaTotal} registros
                </Badge>
              )}
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <QuarantineTable initialData={initialQuarantineData} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Homologación ────────────────────────────────────── */}
        <TabsContent value="homologation" className="mt-4">
          <HomologationClient
            initialData={pendingHomologations}
            reinyeccionCount={reinyeccionCount}
            isReadOnly={isReadOnly}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/quality/quality-shell.tsx"
git commit -m "feat(quality): add QualityShell client wrapper with tab state management"
```

---

## Task 3: Refactor `page.tsx`

**Files:**
- Modify: `app/(admin)/quality/page.tsx` (replace entire file)

El server component ahora solo fetcha y delega a `QualityShell`. Se elimina el grid de KPI cards y la definición de Tabs del server.

- [ ] **Step 1: Replace the entire file**

```tsx
// app/(admin)/quality/page.tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/ui/page-header";
import { getQuarantineRecords } from "@/lib/api/quarantine";
import { JWT_COOKIE_NAME, getSession } from "@/lib/auth/session";
import { getPendingHomologations, getReinjectionStats } from "@/lib/api/homologation";
import { QualityShell } from "./quality-shell";

export const metadata: Metadata = { title: "Gobierno y Calidad de Datos" };

export default async function QualityPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME)?.value;
  const session = await getSession();

  const [quarantineRes, pendingHomologations, reinjectionData] = await Promise.all([
    getQuarantineRecords(1, 100, token),
    getPendingHomologations(token),
    getReinjectionStats(token),
  ]);

  const quarantineData = quarantineRes.datos;
  const totalQuarantine = quarantineRes.total;
  const reinyeccionCount = reinjectionData?.candidatos || 0;
  const pendingQuarantine = quarantineData.filter(
    (d) => d.estado.toUpperCase() === "PENDIENTE",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gobierno y Calidad de Datos"
        description="Monitor de salud, cuarentena, homologación interactiva y reinyección de datos."
      />
      <QualityShell
        cuarentenaTotal={totalQuarantine}
        cuarentenaPendiente={pendingQuarantine}
        reinyeccionCount={reinyeccionCount}
        initialQuarantineData={quarantineData}
        pendingHomologations={pendingHomologations}
        isReadOnly={session?.role === "analyst"}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/quality/page.tsx"
git commit -m "refactor(quality): page.tsx delegates to QualityShell, removes inline KPI grid and Tabs"
```

---

## Task 4: Grouped quarantine table

**Files:**
- Modify: `app/(admin)/quality/quarantine-table.tsx` (replace entire file)

Reemplaza el `DataTable` flat con una vista agrupada por `tabla_origen`. Cada grupo es una sección colapsable con badge de conteo. Se elimina la dependencia de `DataTable`.

- [ ] **Step 1: Replace the entire file**

```tsx
// app/(admin)/quality/quarantine-table.tsx
"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  FileWarning,
  Filter,
  Layers,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { QuarantineRecord } from "@/lib/schemas/quarantine";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface QuarantineTableProps {
  initialData: QuarantineRecord[];
}

interface TableGroup {
  tabla: string;
  records: QuarantineRecord[];
  pendientes: number;
}

export function QuarantineTable({ initialData }: QuarantineTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(initialData.map((r) => r.tabla_origen)),
  );

  const statusOptions = useMemo(
    () => Array.from(new Set(initialData.map((r) => r.estado))).sort(),
    [initialData],
  );

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? initialData
        : initialData.filter((r) => r.estado === statusFilter),
    [initialData, statusFilter],
  );

  const groups = useMemo<TableGroup[]>(() => {
    const map = new Map<string, QuarantineRecord[]>();
    for (const r of filtered) {
      if (!map.has(r.tabla_origen)) map.set(r.tabla_origen, []);
      map.get(r.tabla_origen)!.push(r);
    }
    return Array.from(map.entries()).map(([tabla, records]) => ({
      tabla,
      records,
      pendientes: records.filter((r) => r.estado.toUpperCase() === "PENDIENTE").length,
    }));
  }, [filtered]);

  function toggleGroup(tabla: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(tabla)) next.delete(tabla);
      else next.add(tabla);
      return next;
    });
  }

  if (initialData.length === 0) {
    return (
      <div className="py-16 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--color-success)]/30" />
        <p className="mt-3 text-sm font-medium text-[var(--color-text-muted)]">
          Sin registros en cuarentena
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)]/40 bg-[var(--color-surface)]/50 p-4">
        <Filter className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
        <span className="mr-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          Filtros
        </span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[160px] text-xs">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {statusFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="h-8 gap-1.5 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]"
          >
            <XCircle className="h-3 w-3" />
            Limpiar
          </Button>
        )}
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">
          {filtered.length} registros · {groups.length} tablas
        </span>
      </div>

      {/* Grupos por tabla */}
      <div className="flex flex-col gap-2">
        {groups.map((group) => {
          const isOpen = openGroups.has(group.tabla);
          const isFact = group.tabla.toLowerCase().startsWith("fact");

          return (
            <div
              key={group.tabla}
              className="overflow-hidden rounded-xl border border-[var(--color-border)]/40 bg-[var(--color-surface)] shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggleGroup(group.tabla)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-2)]/60"
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                )}
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                    isFact
                      ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                      : "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
                  )}
                >
                  {isFact ? (
                    <Layers className="h-4 w-4" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                </div>
                <span className="flex-1 text-sm font-semibold">{group.tabla}</span>
                <div className="flex items-center gap-2">
                  {group.pendientes > 0 && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-400"
                    >
                      <Clock className="h-3 w-3" />
                      {group.pendientes} pendientes
                    </Badge>
                  )}
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {group.records.length} registros
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-[var(--color-border)]/40 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--color-surface-2)]/50">
                      <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        <th className="px-4 py-2">Columna</th>
                        <th className="px-4 py-2">Valor</th>
                        <th className="px-4 py-2">Motivo</th>
                        <th className="px-4 py-2">Estado</th>
                        <th className="px-4 py-2">Ingresado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]/40">
                      {group.records.map((r, i) => {
                        const isPendiente = r.estado.toUpperCase() === "PENDIENTE";
                        return (
                          <tr
                            key={`${r.tabla_origen}-${r.id_registro}-${i}`}
                            className="transition-colors hover:bg-[var(--color-surface-2)]/40"
                          >
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                                {r.columna_origen || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <code className="rounded border border-[var(--color-destructive)]/10 bg-[var(--color-destructive)]/5 px-1.5 py-0.5 font-mono text-xs text-[var(--color-destructive)]">
                                {r.valor_raw !== null ? String(r.valor_raw) : "NULL"}
                              </code>
                            </td>
                            <td className="px-4 py-2.5">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex max-w-[200px] cursor-help items-center gap-1.5">
                                      <FileWarning className="h-3.5 w-3.5 shrink-0 text-[var(--color-warning)]" />
                                      <span className="truncate text-xs text-[var(--color-text-muted)]">
                                        {r.motivo || "Error de validación"}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-xs">{r.motivo}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "gap-1 text-[10px] font-bold uppercase",
                                  isPendiente
                                    ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
                                )}
                              >
                                {isPendiente ? (
                                  <Clock className="h-3 w-3" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                {r.estado}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(r.fecha_ingreso)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-text-muted)]">
            No se encontraron registros con los filtros aplicados.
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/quality/quarantine-table.tsx"
git commit -m "feat(quality): quarantine grouped by tabla_origen with collapsible accordion sections"
```

---

## Task 5: Homologation — confidence split + progress + sticky bar

**Files:**
- Modify: `app/(admin)/quality/homologation-client.tsx` (replace entire file)

Cambios principales:
1. **Progress bar**: muestra `N de M registros con corrección asignada`.
2. **Split de confianza**: sección "Alta confianza ≥95%" colapsable y pre-seleccionada arriba; "Requieren revisión <95%" abajo.
3. **Sticky action bar**: aparece en la parte inferior cuando hay items seleccionados (`position: fixed`).
4. **Re-inyección**: se convierte en un strip persistente en la barra de progreso (ya no es una card oculta).
5. **`HomologationTable`**: subcomponente interno para evitar duplicar el render de filas.

Las funciones BFF (`bffResolve`, `bffReject`, `bffRunReinjection`, `fetchCatalogOptions`) son idénticas al archivo actual — se copian sin cambios.

- [ ] **Step 1: Replace the entire file**

```tsx
// app/(admin)/quality/homologation-client.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Info,
  Layers,
  Save,
  Search,
  Sparkles,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { HomologationRecord } from "@/lib/schemas/homologation";
import { cn } from "@/lib/utils";

interface HomologationClientProps {
  initialData: HomologationRecord[];
  reinyeccionCount: number;
  isReadOnly?: boolean;
}

// ---------------------------------------------------------------------------
// BFF helpers — mutaciones via /api/cc/* del portal (cookie httpOnly)
// ---------------------------------------------------------------------------

async function bffResolve(
  tabla: string,
  id: string | number,
  valorCanonico: string,
): Promise<void> {
  const res = await fetch(
    `/api/cc/quality/${encodeURIComponent(tabla)}/${encodeURIComponent(String(id))}/resolver`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ valorCanonico, comentario: null }),
    },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? `Error ${res.status}`);
  }
}

async function bffReject(tabla: string, id: string | number): Promise<void> {
  const res = await fetch(
    `/api/cc/quality/${encodeURIComponent(tabla)}/${encodeURIComponent(String(id))}/rechazar`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ motivo: "Rechazado desde Portal Next.js" }),
    },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? `Error ${res.status}`);
  }
}

async function bffRunReinjection(): Promise<{
  reinyectados: number;
  mensaje?: string | null;
}> {
  const res = await fetch("/api/cc/reinyeccion", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? `Error ${res.status}`);
  }
  return res.json() as Promise<{ reinyectados: number; mensaje?: string | null }>;
}

async function fetchCatalogOptions(campo: string): Promise<string[]> {
  const c = campo.toLowerCase();
  let endpoint = "";
  let extractor: (item: Record<string, unknown>) => string | null;

  if (c.includes("variedad")) {
    endpoint = "/api/cc/catalogos/variedades";
    extractor = (item) => {
      const v = item["nombreCanonico"];
      return typeof v === "string" && v.length > 0 ? v : null;
    };
  } else if (["personal", "nombre", "responsable", "trabajador"].some((x) => c.includes(x))) {
    endpoint = "/api/cc/catalogos/personal";
    extractor = (item) => {
      const v = item["nombreCompleto"];
      return typeof v === "string" && v.length > 0 ? v : null;
    };
  } else if (
    c.includes("fundo") || c.includes("sector") || c.includes("modulo") ||
    c.includes("turno") || c.includes("valvula") || c.includes("cama")
  ) {
    endpoint = "/api/cc/catalogos/geografia";
    const geoKey = c.includes("fundo") ? "fundo"
      : c.includes("sector") ? "sector"
      : c.includes("modulo") ? "modulo"
      : c.includes("turno") ? "turno"
      : c.includes("valvula") ? "valvula"
      : "cama";
    extractor = (item) => {
      const v = item[geoKey];
      if (v == null) return null;
      const s = String(v).trim();
      return s.length > 0 ? s : null;
    };
  } else {
    return [];
  }

  const PAGE_SIZE = 200;
  const accumulated = new Set<string>();
  let pagina = 1;

  while (true) {
    const res = await fetch(`${endpoint}?pagina=${pagina}&tamano=${PAGE_SIZE}`, {
      credentials: "include",
    });
    if (!res.ok) break;
    const data = (await res.json()) as {
      total: number; pagina: number; tamano: number;
      datos: Record<string, unknown>[];
    };
    if (!data.datos || data.datos.length === 0) break;
    for (const item of data.datos) {
      const val = extractor(item);
      if (val !== null) accumulated.add(val);
    }
    if (data.datos.length < PAGE_SIZE) break;
    pagina++;
  }

  return Array.from(accumulated).sort();
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function HomologationClient({
  initialData,
  reinyeccionCount,
  isReadOnly = false,
}: HomologationClientProps) {
  const { toast } = useToast();
  const [data, setData] = useState(initialData);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [highConfOpen, setHighConfOpen] = useState(true);

  const [tableFilter, setTableFilter] = useState("all");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [catalogCache, setCatalogCache] = useState<Record<string, string[]>>({});

  useEffect(() => {
    async function loadCatalog() {
      if (fieldFilter !== "all" && !catalogCache[fieldFilter]) {
        try {
          const options = await fetchCatalogOptions(fieldFilter);
          setCatalogCache((prev) => ({ ...prev, [fieldFilter]: options }));
        } catch (e) {
          console.error("Error loading catalog", e);
        }
      }
    }
    loadCatalog();
  }, [fieldFilter, catalogCache]);

  useEffect(() => {
    const highConfIds = initialData
      .filter((d) => d.score >= 0.95)
      .map((d) => d.id_registro);
    setSelectedIds(new Set(highConfIds));
    const initial: Record<string, string> = {};
    initialData.forEach((d) => {
      if (d.valor_sugerido) initial[d.id_registro] = d.valor_sugerido;
    });
    setCorrections(initial);
  }, [initialData]);

  const tableOptions = useMemo(
    () => Array.from(new Set(initialData.map((d) => d.tabla))).sort(),
    [initialData],
  );
  const fieldOptions = useMemo(
    () => Array.from(new Set(initialData.map((d) => d.campo))).sort(),
    [initialData],
  );

  const filteredData = useMemo(
    () =>
      data.filter((d) => {
        const matchTable = tableFilter === "all" || d.tabla === tableFilter;
        const matchField = fieldFilter === "all" || d.campo === fieldFilter;
        const matchSearch =
          !search ||
          d.texto_crudo.toLowerCase().includes(search.toLowerCase()) ||
          d.tabla.toLowerCase().includes(search.toLowerCase());
        return matchTable && matchField && matchSearch;
      }),
    [data, tableFilter, fieldFilter, search],
  );

  const highConfData = useMemo(
    () => filteredData.filter((d) => d.score >= 0.95),
    [filteredData],
  );
  const needsReviewData = useMemo(
    () => filteredData.filter((d) => d.score < 0.95),
    [filteredData],
  );

  const reviewedCount = useMemo(
    () =>
      filteredData.filter(
        (d) => selectedIds.has(d.id_registro) && corrections[d.id_registro],
      ).length,
    [filteredData, selectedIds, corrections],
  );

  const toggleSelect = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApproveHighConf = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      highConfData.forEach((d) => next.add(d.id_registro));
      return next;
    });
  };

  const handleSaveSelected = async () => {
    if (selectedIds.size === 0) return;
    setGlobalLoading(true);
    let success = 0;
    let failed = 0;
    for (const id of Array.from(selectedIds)) {
      const record = data.find((d) => d.id_registro === id);
      const correction = corrections[id];
      if (record && correction) {
        try {
          await bffResolve(record.tabla, id, correction);
          success++;
        } catch {
          failed++;
        }
      }
    }
    toast({
      title: "Proceso completado",
      description: `Se guardaron ${success} registros.${failed ? ` ${failed} fallaron.` : ""}`,
      variant: failed ? "destructive" : "default",
    });
    setData((prev) => prev.filter((d) => !selectedIds.has(d.id_registro)));
    setSelectedIds(new Set());
    setGlobalLoading(false);
  };

  const handleRejectSelected = async () => {
    if (selectedIds.size === 0) return;
    setGlobalLoading(true);
    let success = 0;
    for (const id of Array.from(selectedIds)) {
      const record = data.find((d) => d.id_registro === id);
      if (record) {
        try {
          await bffReject(record.tabla, id);
          success++;
        } catch {}
      }
    }
    toast({ title: "Registros rechazados", description: `Se eliminaron ${success} registros de la cola.` });
    setData((prev) => prev.filter((d) => !selectedIds.has(d.id_registro)));
    setSelectedIds(new Set());
    setGlobalLoading(false);
  };

  const handleReinject = async () => {
    setGlobalLoading(true);
    try {
      const res = await bffRunReinjection();
      toast({
        title: "Reinyección exitosa",
        description: res.mensaje ?? `${res.reinyectados} registros vueltos a encolar.`,
      });
    } catch {
      toast({ title: "Error en reinyección", variant: "destructive" });
    }
    setGlobalLoading(false);
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <CheckCircle2 className="h-16 w-16 text-[var(--color-success)]/30" />
        <div>
          <p className="font-semibold text-[var(--color-text)]">¡Cola vacía!</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            No hay registros pendientes de homologación.
          </p>
        </div>
        {reinyeccionCount > 0 && !isReadOnly && (
          <Button onClick={handleReinject} disabled={globalLoading} className="gap-2">
            <Zap className="h-4 w-4" />
            Ejecutar Reinyección ({reinyeccionCount} listos)
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Progress + reinyección */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)]/40 bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-[var(--color-text)]">
              Progreso de homologación
            </span>
            <p className="text-xs text-[var(--color-text-muted)]">
              {reviewedCount} de {filteredData.length} registros con corrección asignada
            </p>
          </div>
          {reinyeccionCount > 0 && !isReadOnly && (
            <Button size="sm" onClick={handleReinject} disabled={globalLoading} className="gap-2 shrink-0">
              <Zap className="h-4 w-4" />
              Reinyectar ({reinyeccionCount})
            </Button>
          )}
        </div>
        <Progress
          value={filteredData.length > 0 ? (reviewedCount / filteredData.length) * 100 : 0}
          className="h-2 [&>div]:bg-[var(--color-success)]"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)]/40 bg-[var(--color-surface)] p-3">
        <div className="relative w-full sm:w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden />
          <Input
            placeholder="Buscar por dato o tabla..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger className="h-9 w-[150px] text-xs">
            <SelectValue placeholder="Tabla" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las tablas</SelectItem>
            {tableOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fieldFilter} onValueChange={setFieldFilter}>
          <SelectTrigger className="h-9 w-[150px] text-xs">
            <SelectValue placeholder="Campo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los campos</SelectItem>
            {fieldOptions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        {(tableFilter !== "all" || fieldFilter !== "all" || search) && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { setTableFilter("all"); setFieldFilter("all"); setSearch(""); }}
            className="h-9 px-2 text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Sección: Alta confianza ≥95% */}
      {highConfData.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <button
            type="button"
            onClick={() => setHighConfOpen((o) => !o)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-emerald-500/10"
            aria-expanded={highConfOpen}
          >
            {highConfOpen
              ? <ChevronDown className="h-4 w-4 shrink-0 text-emerald-400" />
              : <ChevronRight className="h-4 w-4 shrink-0 text-emerald-400" />}
            <Sparkles className="h-4 w-4 text-emerald-400" aria-hidden />
            <span className="flex-1 text-sm font-semibold text-emerald-400">
              Alta confianza ≥ 95%
            </span>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400">
              {highConfData.length} registros
            </Badge>
            {!isReadOnly && (
              <Button
                variant="outline" size="sm"
                onClick={(e) => { e.stopPropagation(); handleApproveHighConf(); }}
                className="h-7 gap-1 border-emerald-500/30 text-[10px] text-emerald-400 hover:bg-emerald-500/10"
              >
                <CheckCircle2 className="h-3 w-3" />
                Seleccionar todos
              </Button>
            )}
          </button>
          {highConfOpen && (
            <div className="border-t border-emerald-500/20">
              <HomologationTable
                rows={highConfData}
                corrections={corrections}
                selectedIds={selectedIds}
                catalogCache={catalogCache}
                isReadOnly={isReadOnly}
                onToggle={toggleSelect}
                onCorrectionChange={(id, val) =>
                  setCorrections((prev) => ({ ...prev, [id]: val }))
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Sección: Requieren revisión <95% */}
      {needsReviewData.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)]/40 bg-[var(--color-surface)] shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--color-border)]/40 px-4 py-3">
            <Info className="h-4 w-4 text-amber-400" aria-hidden />
            <span className="flex-1 text-sm font-semibold text-[var(--color-text)]">
              Requieren revisión &lt; 95%
            </span>
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-400">
              {needsReviewData.length} registros
            </Badge>
          </div>
          <HomologationTable
            rows={needsReviewData}
            corrections={corrections}
            selectedIds={selectedIds}
            catalogCache={catalogCache}
            isReadOnly={isReadOnly}
            onToggle={toggleSelect}
            onCorrectionChange={(id, val) =>
              setCorrections((prev) => ({ ...prev, [id]: val }))
            }
          />
        </div>
      )}

      {filteredData.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-text-muted)]">
          No hay registros que coincidan con los criterios.
        </div>
      )}

      {/* Sticky action bar — visible cuando hay seleccionados */}
      {!isReadOnly && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] px-6 py-3 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <span className="text-sm font-medium text-[var(--color-text-muted)]">
            {selectedIds.size} seleccionados
          </span>
          <div className="h-4 w-px bg-[var(--color-border)]" />
          <Button
            variant="outline" size="sm" disabled={globalLoading}
            onClick={handleRejectSelected}
            className="gap-2 hover:border-[var(--color-destructive)]/30 hover:text-[var(--color-destructive)]"
          >
            <Trash2 className="h-4 w-4" />
            Rechazar
          </Button>
          <Button
            size="sm" disabled={globalLoading}
            onClick={handleSaveSelected}
            className="gap-2 shadow-md"
          >
            <Save className="h-4 w-4" />
            Guardar seleccionados
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HomologationTable — subcomponente interno reutilizado por ambas secciones
// ---------------------------------------------------------------------------

interface HomologationTableProps {
  rows: HomologationRecord[];
  corrections: Record<string, string>;
  selectedIds: Set<string | number>;
  catalogCache: Record<string, string[]>;
  isReadOnly: boolean;
  onToggle: (id: string | number) => void;
  onCorrectionChange: (id: string | number, val: string) => void;
}

function HomologationTable({
  rows,
  corrections,
  selectedIds,
  catalogCache,
  isReadOnly,
  onToggle,
  onCorrectionChange,
}: HomologationTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--color-border)]/40 bg-[var(--color-surface-2)]/50">
          <tr>
            {!isReadOnly && <th className="w-10 p-4" />}
            <th className="p-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Origen
            </th>
            <th className="p-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Dato Crudo
            </th>
            <th className="w-[260px] p-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Corrección
            </th>
            <th className="w-[120px] p-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Confianza
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]/40">
          {rows.map((d) => {
            const options = catalogCache[d.campo] || [];
            const hasOptions = options.length > 0;
            const isFact = d.tabla.toLowerCase().includes("fact");

            return (
              <tr
                key={d.id_registro}
                className={cn(
                  "transition-colors hover:bg-[var(--color-surface-2)]/60",
                  selectedIds.has(d.id_registro) && "bg-[var(--color-primary)]/5",
                )}
              >
                {!isReadOnly && (
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-[var(--color-primary)]"
                      checked={selectedIds.has(d.id_registro)}
                      onChange={() => onToggle(d.id_registro)}
                      aria-label={`Seleccionar registro ${d.id_registro}`}
                    />
                  </td>
                )}
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                        isFact
                          ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                          : "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
                      )}
                    >
                      {isFact ? <Layers className="h-4 w-4" /> : <Database className="h-4 w-4" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="max-w-[110px] truncate text-xs font-semibold">
                        {d.tabla}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                        {d.campo}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <code className="rounded border border-[var(--color-destructive)]/10 bg-[var(--color-destructive)]/5 px-2 py-1 font-mono text-xs text-[var(--color-destructive)]">
                    {d.texto_crudo}
                  </code>
                </td>
                <td className="p-4">
                  {isReadOnly ? (
                    <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                      {d.valor_sugerido ?? "—"}
                    </span>
                  ) : hasOptions ? (
                    <Select
                      value={corrections[d.id_registro] || ""}
                      onValueChange={(val) => onCorrectionChange(d.id_registro, val)}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-9 border-[var(--color-primary)]/20 text-xs",
                          !corrections[d.id_registro] &&
                            "border-dashed italic text-[var(--color-text-muted)]",
                        )}
                      >
                        <SelectValue placeholder="Seleccionar oficial..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {options.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="relative">
                      <Input
                        value={corrections[d.id_registro] || ""}
                        onChange={(e) => onCorrectionChange(d.id_registro, e.target.value)}
                        className="h-9 border-[var(--color-primary)]/20 pr-8 text-xs"
                        placeholder="Corrección libre..."
                      />
                      <Sparkles className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-primary)]/40" />
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex max-w-[100px] flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span
                        className={
                          d.score >= 0.85
                            ? "text-[var(--color-success)]"
                            : "text-amber-400"
                        }
                      >
                        {Math.round(d.score * 100)}%
                      </span>
                      <Sparkles
                        className={cn(
                          "h-3 w-3",
                          d.score >= 0.9
                            ? "animate-pulse text-[var(--color-primary)]"
                            : "text-[var(--color-text-muted)]/30",
                        )}
                      />
                    </div>
                    <Progress
                      value={d.score * 100}
                      className={cn(
                        "h-1.5",
                        d.score >= 0.85
                          ? "[&>div]:bg-[var(--color-success)]"
                          : "[&>div]:bg-amber-400",
                      )}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/quality/homologation-client.tsx"
git commit -m "feat(quality): homologation split by confidence tier, sticky action bar, progress strip"
```

---

## Task 6: Delete dead code

**Files:**
- Delete: `app/(admin)/quality/quality-client.tsx`

Este archivo no es importado por `page.tsx`, `quality-shell.tsx`, ni por ningún otro componente activo del módulo de calidad.

- [ ] **Step 1: Verify no active imports**

```bash
grep -r "quality-client" "app/" "components/" "hooks/" "lib/"
```
Expected: Cero resultados (el archivo no aparece en ningún import).

- [ ] **Step 2: Remove the file**

```bash
git rm "app/(admin)/quality/quality-client.tsx"
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(quality): remove unused quality-client.tsx (superseded by quality-shell.tsx)"
```

---

## Self-Review

### Spec coverage
- ✅ Pipeline visual del flujo → `PipelineHeader` (Task 1)
- ✅ Tab state centralizado, stages clickeables → `QualityShell` (Task 2)
- ✅ `page.tsx` reducido a fetch + render → Task 3
- ✅ Cuarentena agrupada por tabla con acordeón → Task 4
- ✅ Homologación split alta/baja confianza → Task 5
- ✅ Progress bar de revisión → Task 5
- ✅ Sticky action bar cuando hay seleccionados → Task 5
- ✅ Re-inyección como strip persistente (no card condicional) → Task 5
- ✅ Eliminación de código muerto → Task 6

### Placeholder scan
Ningún TBD, TODO o "similar al task anterior" encontrado. Cada step incluye código completo o comando ejecutable.

### Type consistency
- `QuarantineRecord` de `@/lib/schemas/quarantine` → usado en `quarantine-table.tsx` y `quality-shell.tsx` (ambos importan el mismo path). ✅
- `HomologationRecord` de `@/lib/schemas/homologation` → usado en `homologation-client.tsx` y `quality-shell.tsx`. ✅
- Props de `PipelineHeader` definidos en `pipeline-header.tsx`, consumidos en `quality-shell.tsx` con los mismos nombres. ✅
- Props de `QualityShell` definidos en `quality-shell.tsx`, consumidos en `page.tsx` con los mismos nombres. ✅
- `HomologationTable` es interno a `homologation-client.tsx` — sin riesgo de inconsistencia externa. ✅
