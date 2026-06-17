import type { TableStatus } from "@/lib/schemas/dwh";

/**
 * Constantes visuales y helpers de formato para el diálogo
 * "¿Por qué está stale / failed / sin datos?" del DWH Explorer.
 *
 * Extraídos de `dwh-explain-stale-dialog.tsx` para ser compartidos
 * entre el orquestador, ReasonRow y NodeListItem sin acoplarse al render.
 */

export const STATUS_LABEL: Record<TableStatus, string> = {
  ok: "OK",
  warning: "Advertencia",
  failed: "Falló",
  stale: "Sin actualizar",
  unknown: "Sin datos",
};

export const TONE = {
  ok: {
    border: "border-[color-mix(in_oklab,var(--color-success)_30%,transparent)]",
    bg: "bg-[color-mix(in_oklab,var(--color-success)_5%,transparent)]",
    iconBg: "bg-[color-mix(in_oklab,var(--color-success)_15%,transparent)]",
    text: "text-[var(--color-success)]",
  },
  warn: {
    border: "border-[color-mix(in_oklab,var(--color-warning)_30%,transparent)]",
    bg: "bg-[color-mix(in_oklab,var(--color-warning)_5%,transparent)]",
    iconBg: "bg-[color-mix(in_oklab,var(--color-warning)_15%,transparent)]",
    text: "text-[var(--color-warning)]",
  },
  bad: {
    border:
      "border-[color-mix(in_oklab,var(--color-destructive)_30%,transparent)]",
    bg: "bg-[color-mix(in_oklab,var(--color-destructive)_5%,transparent)]",
    iconBg:
      "bg-[color-mix(in_oklab,var(--color-destructive)_15%,transparent)]",
    text: "text-[var(--color-destructive)]",
  },
} as const;

export type ToneKind = keyof typeof TONE;

export const TONE_BY_STATUS: Record<TableStatus, string> = {
  ok: "text-[var(--color-success)]",
  warning: "text-[var(--color-warning)]",
  failed: "text-[var(--color-destructive)]",
  stale: "text-[var(--color-text-muted)]",
  unknown: "text-[var(--color-text-muted)]",
};

export function toneFor(status: TableStatus): (typeof TONE)[ToneKind] {
  const kind: ToneKind =
    status === "failed"
      ? "bad"
      : status === "warning"
        ? "warn"
        : status === "ok"
          ? "ok"
          : "warn";
  return TONE[kind];
}

export function dotFor(status: TableStatus): string {
  switch (status) {
    case "ok":
      return "var(--color-success)";
    case "warning":
      return "var(--color-warning)";
    case "failed":
      return "var(--color-destructive)";
    default:
      return "var(--color-text-muted)";
  }
}

export function formatAge(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}
