"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ChevronRight, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorPanel } from "@/components/ui/error-panel";
import { DataTable } from "@/components/data-table/data-table";
import { EtlStatusBadge } from "@/components/control-center/etl-status-badge";
import { useEtlRuns } from "@/hooks/use-control-center";
import { useUrlState } from "@/hooks/use-url-state";
import { isUnauthorizedError } from "@/lib/api/session-events";
import {
  formatDateTime,
  formatDuration,
  formatNumber,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EtlRun } from "@/lib/schemas/control-center";

/* ── Constants ────────────────────────────────────────────────────────────── */

const LIMIT_OPTIONS = [25, 50, 100] as const;
type LimitOption = (typeof LIMIT_OPTIONS)[number];

/* ── Component ────────────────────────────────────────────────────────────── */

export function HistoryTab() {
  /* Sync limit with URL — default 25 */
  const [{ limit: rawLimit }, setUrlState] = useUrlState({ limit: 25 });
  const limit: LimitOption = (LIMIT_OPTIONS as readonly number[]).includes(
    rawLimit,
  )
    ? (rawLimit as LimitOption)
    : 25;

  function setLimit(n: LimitOption) {
    setUrlState({ limit: n });
  }

  const { data, isLoading, isError, error, refetch, isFetching } =
    useEtlRuns(limit);

  /* ── Columns ─────────────────────────────────────────────────────────── */

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
          <span className="tabular-nums text-xs">
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
                "font-medium text-[var(--color-warning)]",
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
            <ErrorPill message={row.original.error} />
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

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <section
      aria-label="Historial de corridas ETL"
      className="flex flex-col gap-4"
    >
      {/* Toolbar */}
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
                type="button"
                onClick={() => setLimit(n)}
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
          <RefreshCw
            aria-hidden
            className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
          />
          Refrescar
        </Button>
      </div>

      {/* Content */}
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
              error instanceof Error
                ? error.message
                : "El backend no respondió."
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

/* ── Private sub-components ──────────────────────────────────────────────── */

function ErrorPill({ message }: { message: string }) {
  return (
    <span
      title={message}
      className="inline-flex max-w-[180px] items-center gap-1 rounded border border-[color-mix(in_oklab,var(--color-destructive)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,transparent)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-destructive)]"
    >
      <AlertTriangle aria-hidden className="h-3 w-3" />
      <span className="truncate">Ver error</span>
    </span>
  );
}
