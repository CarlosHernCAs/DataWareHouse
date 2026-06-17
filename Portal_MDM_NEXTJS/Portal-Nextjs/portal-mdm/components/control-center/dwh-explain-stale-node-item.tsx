"use client";

/**
 * components/control-center/dwh-explain-stale-node-item.tsx
 * ==========================================================
 * Ítem de lista de un nodo DWH dentro de las secciones "upstream con
 * problemas" y "downstream afectado" del diálogo "¿Por qué está stale?".
 */

import { cn } from "@/lib/utils";
import { formatAge, dotFor, TONE_BY_STATUS, STATUS_LABEL } from "./dwh-explain-stale-constants";
import type { DwhNode } from "@/lib/schemas/dwh";

interface NodeListItemProps {
  node: DwhNode;
}

export function NodeListItem({ node }: NodeListItemProps) {
  const tone = TONE_BY_STATUS[node.status];
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  return (
    <li className="flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px]">
      <span
        aria-hidden
        className={cn("inline-block h-1.5 w-1.5 rounded-full")}
        style={{ background: dotFor(node.status) }}
      />
      <span className="min-w-0 flex-1 truncate font-mono text-[var(--color-text)]">
        {node.fullName}
      </span>
      <span className={cn("shrink-0", tone)}>{STATUS_LABEL[node.status]}</span>
      {node.lastLoadAt ? (
        <span className="hidden shrink-0 text-[10px] tabular-nums text-[var(--color-text-muted)] sm:inline">
          {formatAge((nowMs - Date.parse(node.lastLoadAt)) / 3_600_000)} ago
        </span>
      ) : null}
    </li>
  );
}
