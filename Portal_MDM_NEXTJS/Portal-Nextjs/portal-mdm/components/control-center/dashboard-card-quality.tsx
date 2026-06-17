"use client";

import dynamic from "next/dynamic";
import { ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCardFrame } from "./dashboard-card-frame";
import { EmptyState, ErrorState, pickLevel } from "./dashboard-card-primitives";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQualityKpis, useSystemHealth } from "@/hooks/use-control-center";

const QualityPieChart = dynamic(
  () => import("./quality-pie-chart").then((m) => m.QualityPieChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[150px] rounded-md" />,
  },
);

export function QualitySummaryCard() {
  const { data: health } = useSystemHealth();
  const { data, isLoading, isError, error, refetch } = useQualityKpis();
  const level = pickLevel(health, "quality");

  return (
    <DashboardCardFrame
      title="Calidad · cuarentena"
      description="Estado de los registros en MDM.Cuarentena"
      href="/quality"
      level={level}
    >
      {isLoading && !data ? (
        // V5: iso-layout — número grande + sub-line + donut 150px.
        <div className="flex flex-col gap-3" aria-busy="true">
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-9 w-24 rounded" />
            <Skeleton className="h-3.5 w-40 rounded" />
          </div>
          <Skeleton className="h-[150px] rounded-md" />
        </div>
      ) : isError || !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data.total === 0 ? (
        <EmptyState
          icon={<ShieldCheck aria-hidden className="h-5 w-5" />}
          tone="success"
          title="Cuarentena vacía"
          description="Los registros entran a cuarentena cuando fallan las reglas de validación de Silver."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <span
              className={cn(
                "text-4xl font-bold tabular-nums",
                data.resolutionRate >= 90
                  ? "text-[var(--color-success)]"
                  : data.resolutionRate >= 70
                    ? "text-[var(--color-warning)]"
                    : "text-[var(--color-destructive)]",
              )}
            >
              {data.resolutionRate.toFixed(1)}%
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">
              tasa de resolución · {formatNumber(data.total)} registros totales
            </span>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
            <span>
              <span className="font-semibold tabular-nums text-[var(--color-warning)]">
                {formatNumber(data.pendientes)}
              </span>{" "}
              <span className="text-[var(--color-text-muted)]">pendientes</span>
            </span>
            <span>
              <span className="font-semibold tabular-nums text-[var(--color-success)]">
                {formatNumber(data.resueltos)}
              </span>{" "}
              <span className="text-[var(--color-text-muted)]">resueltos</span>
            </span>
            <span>
              <span className="font-semibold tabular-nums text-[var(--color-text-muted)]">
                {formatNumber(data.descartados)}
              </span>{" "}
              <span className="text-[var(--color-text-muted)]">descartados</span>
            </span>
          </div>

          <QualityPieChart
            pendientes={data.pendientes}
            resueltos={data.resueltos}
            descartados={data.descartados}
          />
        </div>
      )}
    </DashboardCardFrame>
  );
}
