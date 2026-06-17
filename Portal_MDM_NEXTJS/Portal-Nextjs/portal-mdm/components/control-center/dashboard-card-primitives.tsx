"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ timeAgo */

export function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "—";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

/* --------------------------------------------------------------- ErrorState */

export function ErrorState({
  onRetry,
  error,
}: {
  onRetry: () => void;
  error?: unknown;
}) {
  const msg =
    error instanceof Error
      ? error.message
      : "El backend no respondió o devolvió un error.";
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-md border border-[var(--color-destructive)]/40 bg-[var(--color-surface-2)] p-4 text-sm"
    >
      <div className="flex items-center gap-2 text-[var(--color-destructive)]">
        <AlertTriangle aria-hidden className="h-4 w-4" />
        <span className="font-medium">No se pudo cargar</span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">{msg}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw aria-hidden className="h-3.5 w-3.5" />
        Reintentar
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- EmptyState */

export function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  tone = "muted",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  tone?: "muted" | "success";
}) {
  const iconColor =
    tone === "success"
      ? "text-[var(--color-success)]"
      : "text-[var(--color-text-muted)]";
  return (
    <div className="flex flex-col items-start gap-2 py-2">
      <span aria-hidden className={cn("opacity-70", iconColor)}>
        {icon}
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-[var(--color-text)]">{title}</p>
        <p className="max-w-prose text-xs text-[var(--color-text-muted)]">
          {description}
        </p>
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-ring)] focus-visible:outline-offset-2"
        >
          {actionLabel}
          <ArrowRight aria-hidden className="h-3 w-3" />
        </Link>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------------- Stat */

export function Stat({
  label,
  value,
  icon,
  valueClass,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          valueClass,
        )}
      >
        {value}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- pickLevel */

import type { StatusLevel } from "@/lib/schemas/control-center";

export function pickLevel(
  data:
    | { etl?: StatusLevel; dwh?: StatusLevel; quality?: StatusLevel; alerts?: StatusLevel }
    | undefined,
  key: "etl" | "dwh" | "quality" | "alerts",
): StatusLevel | undefined {
  return data?.[key];
}
