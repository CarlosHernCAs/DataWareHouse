"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCardFrame } from "./dashboard-card-frame";
import { ErrorState, pickLevel } from "./dashboard-card-primitives";
import { cn } from "@/lib/utils";
import { useEtlTrend, useSystemHealth } from "@/hooks/use-control-center";

/**
 * Recharts pesa ~400 KB (sin gzip) y antes entraba al bundle inicial
 * del `/dashboard`. Lo lazificamos vía `next/dynamic` con `ssr:false`:
 * el HTML del primer paint trae todos los datos hidratados, y la JS
 * de los charts llega en un chunk separado mientras el usuario ya
 * está viendo los números.
 */
const EtlTrendChart = dynamic(
  () => import("./etl-trend-chart").then((m) => m.EtlTrendChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[260px] rounded-md" />,
  },
);

export function EtlTrendCard() {
  const { data: health } = useSystemHealth();
  const level = pickLevel(health, "etl");

  const [range, setRange] = useState<7 | 14 | 30>(14);
  const { data, isLoading, isError, error, refetch } = useEtlTrend(range);

  const wow = useMemo(() => {
    const mid = Math.floor(range / 2);
    if (!data || data.length < range) return null;
    const prevFailed = data.slice(0, mid).reduce((s, p) => s + p.failed, 0);
    const currFailed = data.slice(mid).reduce((s, p) => s + p.failed, 0);
    if (prevFailed === 0 && currFailed === 0) return { pct: 0, improved: true };
    if (prevFailed === 0) return { pct: 100, improved: false };
    const pct = Math.round(((currFailed - prevFailed) / prevFailed) * 100);
    return { pct, improved: pct <= 0 };
  }, [data, range]);

  return (
    <DashboardCardFrame
      title="Tendencia ETL"
      description="Corridas exitosas vs. fallidas por día"
      href="/etl-monitor"
      level={level}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        {/* Range selector */}
        <div
          role="group"
          aria-label="Rango de tendencia"
          className="flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5"
        >
          {([7, 14, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setRange(d)}
              aria-pressed={range === d}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-medium transition-colors min-w-[36px]",
                range === d
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              )}
            >
              {d}d
            </button>
          ))}
        </div>

        {/* WoW badge */}
        {wow ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--color-text-muted)]">vs. período anterior:</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
                wow.improved
                  ? "bg-[color-mix(in_oklab,var(--color-success)_15%,transparent)] text-[var(--color-success)]"
                  : "bg-[color-mix(in_oklab,var(--color-destructive)_15%,transparent)] text-[var(--color-destructive)]",
              )}
            >
              {wow.pct === 0 ? "Sin cambio" : `${wow.improved ? "" : "+"}${wow.pct}% fallos`}
            </span>
          </div>
        ) : null}
      </div>

      {isLoading && !data ? (
        <Skeleton className="h-[260px] rounded-md" />
      ) : isError || !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <EtlTrendChart data={data} />
      )}
    </DashboardCardFrame>
  );
}
