"use client";

import { Database, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCardFrame } from "./dashboard-card-frame";
import { ErrorState, Stat, pickLevel, timeAgo } from "./dashboard-card-primitives";
import { DataFreshnessTable } from "./data-freshness-table";
import { formatNumber } from "@/lib/format";
import { useDwhState, useSystemHealth } from "@/hooks/use-control-center";

export function DwhStateCard() {
  const { data: health } = useSystemHealth();
  const { data, isLoading, isError, error, refetch } = useDwhState();
  const level = pickLevel(health, "dwh");

  return (
    <DashboardCardFrame
      title="Estado DWH"
      description="Catálogo de facts y actividad 24 h"
      href="/dwh"
      level={level}
    >
      {isLoading && !data ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-md" />
          ))}
        </div>
      ) : isError || !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Facts registradas"
              value={formatNumber(data.tables)}
              icon={<Database className="h-4 w-4" aria-hidden />}
            />
            <Stat
              label="Filas insertadas 24 h"
              value={formatNumber(data.rowsLast24h)}
            />
            <Stat
              label="Rechazadas 24 h"
              value={formatNumber(data.rejectedLast24h)}
              valueClass={
                data.rejectedLast24h > 0
                  ? "text-[var(--color-warning)]"
                  : undefined
              }
            />
            <Stat
              label="Fallos 24 h"
              value={formatNumber(data.failedLast24h)}
              valueClass={
                data.failedLast24h > 0
                  ? "text-[var(--color-destructive)]"
                  : undefined
              }
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <RefreshCw aria-hidden className="h-3 w-3" />
            {data.lastSuccessAt
              ? `Última corrida exitosa ${timeAgo(data.lastSuccessAt)}`
              : "Sin corridas exitosas registradas"}
          </div>
          <DataFreshnessTable />
        </div>
      )}
    </DashboardCardFrame>
  );
}
