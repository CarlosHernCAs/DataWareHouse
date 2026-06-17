"use client";

/**
 * components/control-center/dwh-explain-stale-dialog.tsx
 * ======================================================
 * Modal "¿Por qué está stale / failed / sin datos?".
 *
 * Toda la inferencia es client-side a partir de `DwhExplorerPayload` —
 * no requiere endpoint nuevo. Cuando el backend exponga un
 * `/api/cc/dwh/explain/:id` enriquecido (bitácora real, último error, etc.)
 * basta con sumar esa data; la sección estructural sigue igual.
 *
 * Reglas de derivación:
 *   - Última carga exitosa: `node.lastLoadAt`.
 *   - Edad calculada vs. ahora.
 *   - Rejected last 24h → "filas rechazadas".
 *   - Upstream culpable: para un nodo Silver/Gold buscamos en sus
 *     dependencias (vía edges in-bound) aquellas con status !== ok.
 *   - Downstream impactado: para cualquier nodo, BFS de su downstream
 *     en estado no-ok.
 *
 * Acciones:
 *   - "Re-procesar" → /etl-monitor/lanzar?fact=... (sólo si hay fact asociado).
 *   - "Ver bitácora" → /bitacora?tabla=...
 *   - "Silenciar alerta" deshabilitado (placeholder hasta backend).
 *
 * Piezas extraídas:
 *   - dwh-explain-stale-constants.ts   — STATUS_LABEL, TONE, helpers
 *   - dwh-explain-stale-reason-row.tsx — ReasonRow
 *   - dwh-explain-stale-node-item.tsx  — NodeListItem
 */

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  BellOff,
  Clock,
  Database,
  FileSearch,
  PlayCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { DwhEdge, DwhNode } from "@/lib/schemas/dwh";

import { STATUS_LABEL, toneFor, formatAge } from "./dwh-explain-stale-constants";
import { ReasonRow } from "./dwh-explain-stale-reason-row";
import { NodeListItem } from "./dwh-explain-stale-node-item";

interface DwhExplainStaleDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  node: DwhNode | null;
  nodes: DwhNode[];
  edges: DwhEdge[];
}

export function DwhExplainStaleDialog({
  open,
  onOpenChange,
  node,
  nodes,
  edges,
}: DwhExplainStaleDialogProps) {
  if (!node) return null;

  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const ageHours = node.lastLoadAt
    ? Math.max(0, (nowMs - Date.parse(node.lastLoadAt)) / 3_600_000)
    : null;

  // Upstream con problema = nodos que apuntan a este vía `flow` o `dependency`
  // y cuyo status no es "ok".
  const upstreamProblems = (() => {
    const incoming = edges
      .filter((e) => e.to === node.id)
      .map((e) => nodes.find((n) => n.id === e.from))
      .filter((n): n is DwhNode => !!n);
    return incoming.filter((n) => n.status !== "ok");
  })();

  // Downstream impactado = BFS outbound, filtrando por status !== ok.
  const downstreamImpacted = (() => {
    const adj = new Map<string, string[]>();
    for (const e of edges) {
      (adj.get(e.from) ?? adj.set(e.from, []).get(e.from)!).push(e.to);
    }
    const visited = new Set<string>([node.id]);
    const queue = [node.id];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const next of adj.get(cur) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
    visited.delete(node.id);
    return Array.from(visited)
      .map((id) => nodes.find((n) => n.id === id))
      .filter((n): n is DwhNode => !!n && n.status !== "ok");
  })();

  const factForLaunch = node.facts[0] ?? null;
  const tone = toneFor(node.status);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <Dialog.Content
          aria-describedby="dwh-explain-desc"
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2",
            "max-h-[calc(100vh-3rem)] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl",
            "data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0",
          )}
        >
          <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-3.5">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md",
                    tone.bg,
                  )}
                >
                  <AlertCircle className={cn("h-4 w-4", tone.text)} />
                </span>
                <Dialog.Title className="text-sm font-semibold text-[var(--color-text)]">
                  ¿Por qué está en estado{" "}
                  <span className={tone.text}>{STATUS_LABEL[node.status]}</span>?
                </Dialog.Title>
              </div>
              <p
                id="dwh-explain-desc"
                className="break-all font-mono text-xs text-[var(--color-text-muted)]"
              >
                {node.fullName}
              </p>
            </div>
            <Dialog.Close
              aria-label="Cerrar"
              className="rounded-sm p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </header>

          <div className="flex max-h-[calc(100vh-12rem)] flex-col gap-4 overflow-y-auto px-5 py-4">
            {/* Reason: last load */}
            <ReasonRow
              icon={<Clock className="h-4 w-4" />}
              title="Última carga exitosa"
              kind={
                ageHours == null
                  ? "bad"
                  : ageHours > 72
                    ? "bad"
                    : ageHours > 24
                      ? "warn"
                      : "ok"
              }
            >
              {node.lastLoadAt ? (
                <>
                  <span className="text-[var(--color-text)]">
                    {formatDateTime(node.lastLoadAt)}
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    {" · "}hace {formatAge(ageHours!)}
                  </span>
                </>
              ) : (
                <span className="italic text-[var(--color-text-muted)]">
                  No hay registro de carga
                </span>
              )}
            </ReasonRow>

            {/* Reason: rejected rows */}
            {node.rejectedLast24h > 0 ? (
              <ReasonRow
                icon={<AlertTriangle className="h-4 w-4" />}
                title="Filas rechazadas (24h)"
                kind="warn"
              >
                <span className="font-medium text-[var(--color-warning)] tabular-nums">
                  {formatNumber(node.rejectedLast24h)}
                </span>
                <span className="text-[var(--color-text-muted)]">
                  {" · "}revisa la cuarentena de esta tabla
                </span>
              </ReasonRow>
            ) : null}

            {/* Reason: upstream problems */}
            {upstreamProblems.length > 0 ? (
              <ReasonRow
                icon={<ArrowUpFromLine className="h-4 w-4" />}
                title={`Upstream con problemas (${upstreamProblems.length})`}
                kind="bad"
              >
                <ul className="mt-1 flex flex-col gap-1">
                  {upstreamProblems.slice(0, 5).map((n) => (
                    <NodeListItem key={n.id} node={n} />
                  ))}
                  {upstreamProblems.length > 5 ? (
                    <li className="text-[10px] italic text-[var(--color-text-muted)]">
                      …y {upstreamProblems.length - 5} más
                    </li>
                  ) : null}
                </ul>
              </ReasonRow>
            ) : null}

            {/* Impact: downstream */}
            {downstreamImpacted.length > 0 ? (
              <ReasonRow
                icon={<ArrowDownToLine className="h-4 w-4" />}
                title={`Downstream afectado (${downstreamImpacted.length})`}
                kind="warn"
              >
                <ul className="mt-1 flex flex-col gap-1">
                  {downstreamImpacted.slice(0, 5).map((n) => (
                    <NodeListItem key={n.id} node={n} />
                  ))}
                  {downstreamImpacted.length > 5 ? (
                    <li className="text-[10px] italic text-[var(--color-text-muted)]">
                      …y {downstreamImpacted.length - 5} más impactados
                    </li>
                  ) : null}
                </ul>
              </ReasonRow>
            ) : null}

            {/* Sin razones obvias: estado OK */}
            {node.status === "ok" &&
            (ageHours == null || ageHours < 24) &&
            upstreamProblems.length === 0 &&
            downstreamImpacted.length === 0 ? (
              <p className="rounded-md border border-dashed border-[var(--color-border)] p-3 text-xs italic text-[var(--color-text-muted)]">
                Sin anomalías estructurales. La tabla está al día y nadie aguas
                arriba reporta error.
              </p>
            ) : null}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled
              title="Pendiente — requiere endpoint /alerts/silence"
            >
              <BellOff aria-hidden className="h-4 w-4" />
              Silenciar alerta
            </Button>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/bitacora?tabla=${encodeURIComponent(node.id)}`}
                  onClick={() => onOpenChange(false)}
                >
                  <FileSearch aria-hidden className="h-4 w-4" />
                  Ver bitácora
                </Link>
              </Button>
              {factForLaunch ? (
                <Button asChild variant="primary" size="sm">
                  <Link
                    href={`/etl-monitor/lanzar?fact=${encodeURIComponent(factForLaunch)}`}
                    onClick={() => onOpenChange(false)}
                  >
                    <PlayCircle aria-hidden className="h-4 w-4" />
                    Re-procesar
                  </Link>
                </Button>
              ) : null}
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Database queda como referencia visual; lo dejamos exportado por si
// alguien quiere extender el modal con más secciones.
void Database;
