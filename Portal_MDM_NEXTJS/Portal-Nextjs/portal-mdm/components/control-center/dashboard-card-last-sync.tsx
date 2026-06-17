"use client";

import { Activity, Loader2 } from "lucide-react";
import { timeAgo } from "./dashboard-card-primitives";
import { useSystemHealth } from "@/hooks/use-control-center";

/**
 * Indicador V4: auto-refresh visible.
 *
 * Mientras `isFetching`, mostramos un Loader2 girando + "Actualizando…".
 * Cuando está idle, mostramos "Actualizado hace Ns" derivado de
 * `data.updatedAt`. Da sensación de vida sin ser intrusivo.
 *
 * No introduce un timer client-side — el cálculo de "hace Ns" se hace
 * en cada render, que ya ocurre cada vez que TanStack revalida.
 */
export function LastSyncBadge() {
  const { data, isFetching } = useSystemHealth();

  if (isFetching) {
    return (
      <span
        aria-live="polite"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]"
      >
        <Loader2 aria-hidden className="h-3 w-3 animate-spin" />
        Actualizando…
      </span>
    );
  }

  if (!data) return null;

  return (
    <span
      aria-live="polite"
      className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]"
    >
      <Activity aria-hidden className="h-3 w-3" />
      Actualizado {timeAgo(data.updatedAt)}
    </span>
  );
}
