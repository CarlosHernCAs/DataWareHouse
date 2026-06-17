"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Tile reutilizable del HeroKpis row.
 *
 * Cada tile soporta opcionalmente: sparkline, progress bar, delta chip
 * y un pulse dot. La presentación se controla con `tone` (color base) y
 * `iconTone` (color del badge del icono). Lógica de datos y tonos vive
 * en el orquestador (`hero-kpis.tsx`).
 */

const KpiSparkline = dynamic(
  () => import("./kpi-sparkline").then((m) => m.KpiSparkline),
  { ssr: false, loading: () => null },
);

export type Tone = "destructive" | "warning" | "success" | "info";

export interface KpiTileProps {
  href: string;
  label: string;
  value: string;
  valueSuffix?: string;
  loading: boolean;
  icon: React.ReactNode;
  iconTone: Tone;
  tone?: Tone;
  delta?: { pct: number; up: boolean; label: string };
  sparkline?: { value: number }[];
  sparklineColor?: string;
  progressBar?: { value: number; max: number };
  pulseDot?: boolean;
}

export function KpiTile({
  href,
  label,
  value,
  valueSuffix,
  loading,
  icon,
  iconTone,
  tone,
  delta,
  sparkline,
  sparklineColor,
  progressBar,
  pulseDot,
}: KpiTileProps) {
  const borderTone = tone ? toneBorderClass(tone) : "border-[var(--color-border)]";
  const bgGlow = tone ? toneGlowClass(tone) : "";

  return (
    <Link
      href={href}
      aria-label={`${label}: ${value}${valueSuffix ?? ""}. Abrir detalle.`}
      className={cn(
        "group relative flex min-h-[148px] flex-col justify-between overflow-hidden rounded-lg border bg-[var(--color-surface)] p-4 transition",
        "border-l-4",
        borderTone,
        bgGlow,
        "hover:border-[var(--color-text-muted)] hover:shadow-md hover:bg-[var(--color-surface-2)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <span
          aria-hidden
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md",
            toneBgClass(iconTone),
            toneTextClass(iconTone),
          )}
        >
          {icon}
        </span>
        <div className="flex items-center gap-1.5">
          {pulseDot ? (
            <span
              aria-hidden
              className={cn(
                "h-2 w-2 rounded-full animate-pulse",
                tone === "destructive"
                  ? "bg-[var(--color-destructive)]"
                  : tone === "warning"
                    ? "bg-[var(--color-warning)]"
                    : "bg-[var(--color-info)]",
              )}
            />
          ) : null}
          {delta ? (
            <DeltaChip pct={delta.pct} up={delta.up} label={delta.label} />
          ) : null}
        </div>
      </header>

      {loading ? (
        <Skeleton className="h-10 w-28 rounded" />
      ) : (
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-5xl font-semibold tabular-nums leading-none",
              tone ? toneTextClass(tone) : "text-[var(--color-text)]",
            )}
          >
            {value}
          </span>
          {valueSuffix ? (
            <span className="text-xl font-normal text-[var(--color-text-muted)]">
              {valueSuffix}
            </span>
          ) : null}
        </div>
      )}

      <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        {label}
      </p>

      {progressBar && !loading ? (
        <div
          aria-hidden
          className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              tone === "destructive"
                ? "bg-[var(--color-destructive)]"
                : tone === "warning"
                  ? "bg-[var(--color-warning)]"
                  : "bg-[var(--color-success)]",
            )}
            style={{ width: `${Math.min(100, Math.max(0, progressBar.value))}%` }}
          />
        </div>
      ) : null}

      {sparkline && sparkline.length >= 2 && sparklineColor ? (
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-16 w-2/3 opacity-40 transition-opacity group-hover:opacity-70"
        >
          <KpiSparkline
            data={sparkline}
            color={sparklineColor}
            gradientId={`spark-${label}`}
          />
        </div>
      ) : null}
    </Link>
  );
}

function DeltaChip({ pct, up, label }: { pct: number; up: boolean; label: string }) {
  const bad = up && pct !== 0;
  return (
    <span
      title={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        bad
          ? "bg-[var(--color-destructive-glow)] text-[var(--color-destructive)]"
          : pct === 0
            ? "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
            : "bg-[var(--color-success-glow)] text-[var(--color-success)]",
      )}
    >
      {up ? "▲" : "▼"}
      {pct === 0 ? "=" : `${Math.abs(pct)}%`}
    </span>
  );
}

function toneTextClass(t: Tone): string {
  switch (t) {
    case "destructive": return "text-[var(--color-destructive)]";
    case "warning":     return "text-[var(--color-warning)]";
    case "success":     return "text-[var(--color-success)]";
    case "info":        return "text-[var(--color-info)]";
  }
}

function toneBgClass(t: Tone): string {
  switch (t) {
    case "destructive": return "bg-[var(--color-destructive-glow)]";
    case "warning":     return "bg-[var(--color-warning-glow)]";
    case "success":     return "bg-[var(--color-success-glow)]";
    case "info":        return "bg-[var(--color-info-glow)]";
  }
}

function toneGlowClass(t: Tone): string {
  switch (t) {
    case "destructive": return "bg-[color-mix(in_oklab,var(--color-destructive-glow)_50%,var(--color-surface))]";
    case "warning":     return "bg-[color-mix(in_oklab,var(--color-warning-glow)_50%,var(--color-surface))]";
    default:            return "";
  }
}

function toneBorderClass(t: Tone): string {
  switch (t) {
    case "destructive": return "border-[var(--color-border)] border-l-[var(--color-destructive)]";
    case "warning":     return "border-[var(--color-border)] border-l-[var(--color-warning)]";
    case "success":     return "border-[var(--color-border)] border-l-[var(--color-success)]";
    case "info":        return "border-[var(--color-border)] border-l-[var(--color-info)]";
  }
}

/**
 * Helper para tiles que muestran "fallos hoy vs ayer". Devuelve null si
 * no se pasa "ayer" o si ambos son 0 (no hay nada útil que comparar).
 */
export function deltaFromCounts(hoy: number, ayer: number) {
  if (ayer === 0 && hoy === 0) return { pct: 0, up: false, label: "Igual que ayer" };
  if (ayer === 0) return { pct: 100, up: hoy > 0, label: `Ayer no hubo fallos · hoy ${hoy}` };
  const pct = Math.round(((hoy - ayer) / ayer) * 100);
  return { pct, up: pct > 0, label: `Ayer ${ayer} · hoy ${hoy}` };
}
