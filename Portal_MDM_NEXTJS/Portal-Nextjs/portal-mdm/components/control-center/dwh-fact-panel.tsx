"use client";

/**
 * components/control-center/dwh-fact-panel.tsx
 * =============================================
 * Panel docked (no drawer) que muestra el detalle de un nodo del DWH.
 * Vive DENTRO del grid de la página — el lineage permanece visible
 * mientras inspeccionas. En mobile cae a stack debajo del mapa.
 *
 * Reemplaza visualmente al antiguo `DwhFactDrawer`. Las sub-vistas
 * (Metric, Section, TableList) se mantienen como puramente presentacionales.
 *
 * Orquestador: ensambla header, métricas, sparkline, detalles y acciones
 * desde los módulos hermanos `dwh-fact-panel-*`.
 */

import { Pin, PinOff, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { DwhNode, FactSummary } from "@/lib/schemas/dwh";

import { LAYER_LABEL, STATUS_TONE } from "./dwh-fact-panel-constants";
import { Metric } from "./dwh-fact-panel-primitives";
import { Sparkline } from "./dwh-fact-panel-sparkline";
import { FactDetail, NonFactDetail } from "./dwh-fact-panel-details";
import { SecondaryActions, FactActions } from "./dwh-fact-panel-actions";

/* ── Public API ──────────────────────────────────────────────────────────── */

export interface DwhFactPanelProps {
  node: DwhNode;
  fact: FactSummary | null;
  onClose: () => void;
  pinned?: boolean;
  onTogglePin?: () => void;
  onExplain?: () => void;
  onPreview?: () => void;
  onCompare?: () => void;
  className?: string;
}

export function DwhFactPanel({
  node,
  fact,
  onClose,
  pinned = false,
  onTogglePin,
  onExplain,
  onPreview,
  onCompare,
  className,
}: DwhFactPanelProps) {
  return (
    <aside
      aria-label={`Detalle de ${node.fullName}`}
      className={cn(
        "bg-surface flex h-full min-h-0 flex-col rounded-lg border border-[var(--color-border)] shadow-sm",
        className,
      )}
    >
      {/* ── Header ── */}
      <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{LAYER_LABEL[node.layer]}</Badge>
            <StatusBadge
              tone={STATUS_TONE[node.status]}
              label={node.status.toUpperCase()}
              variant="pill"
              size="sm"
            />
          </div>
          <h2
            className="break-all font-mono text-sm font-semibold text-[var(--color-text)]"
            title={node.fullName}
          >
            {node.fullName}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            {node.rowsLast24h > 0
              ? `${formatNumber(node.rowsLast24h)} filas en últimas 24 h`
              : "Sin actividad en últimas 24 h"}
          </p>
        </div>
        <div className="flex items-start gap-1">
          {onTogglePin ? (
            <button
              type="button"
              aria-label={pinned ? "Quitar de fijados" : "Fijar nodo"}
              aria-pressed={pinned}
              title={pinned ? "Desfijar" : "Fijar este nodo"}
              onClick={onTogglePin}
              className={cn(
                "rounded-sm p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                pinned
                  ? "bg-[color-mix(in_oklab,var(--color-primary)_14%,transparent)] text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
              )}
            >
              {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Cerrar panel"
            onClick={onClose}
            className="rounded-sm p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Métricas */}
        <section aria-label="Métricas" className="grid grid-cols-2 gap-2">
          <Metric label="Filas 24 h" value={formatNumber(node.rowsLast24h)} />
          <Metric
            label="Rechazadas 24 h"
            value={formatNumber(node.rejectedLast24h)}
            tone={node.rejectedLast24h > 0 ? "warning" : "default"}
          />
          <Metric
            label="Última carga"
            value={node.lastLoadAt ? formatDateTime(node.lastLoadAt) : "—"}
            wide
          />
        </section>

        {/* Sparkline histórica */}
        {node.historyDurations.length > 1 && (
          <section className="mt-4">
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Duración histórica (últimas {node.historyDurations.length} cargas)
            </h3>
            <div className="h-8 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1">
              <Sparkline data={node.historyDurations} />
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-[var(--color-text-muted)]">
              <span>Más antigua</span>
              <span>
                Más reciente ({node.historyDurations[node.historyDurations.length - 1]}s)
              </span>
            </div>
          </section>
        )}

        {/* Detalle fact / non-fact */}
        {fact ? <FactDetail fact={fact} /> : <NonFactDetail node={node} />}

        {/* Acciones secundarias */}
        <SecondaryActions
          node={node}
          onExplain={onExplain}
          onPreview={onPreview}
          onCompare={onCompare}
        />

        {/* Acciones de fact */}
        {fact ? (
          <FactActions node={node} fact={fact} onClose={onClose} />
        ) : null}
      </div>
    </aside>
  );
}
