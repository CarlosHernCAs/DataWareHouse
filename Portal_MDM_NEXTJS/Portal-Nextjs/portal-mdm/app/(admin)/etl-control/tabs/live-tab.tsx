"use client";

import Link from "next/link";
import { Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorPanel } from "@/components/ui/error-panel";
import { ActiveRunCard } from "@/components/control-center/active-run-card";
import { useActiveCorridas } from "@/hooks/use-control-center";
import { isUnauthorizedError } from "@/lib/api/session-events";
import { cn } from "@/lib/utils";

export function LiveTab() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useActiveCorridas();

  return (
    <section aria-label="Corridas ETL en curso" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span
            aria-hidden
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              isFetching
                ? "bg-[var(--color-primary)] animate-pulse"
                : "bg-[var(--color-success)]",
            )}
          />
          <span>
            {isFetching ? "Sincronizando…" : "Actualizando cada 5 segundos"}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          aria-label="Refrescar corridas activas"
        >
          <RefreshCw
            aria-hidden
            className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
          />
          Refrescar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-lg" />
          ))}
        </div>
      ) : isError && !isUnauthorizedError(error) ? (
        <ErrorPanel
          message={
            error instanceof Error
              ? error.message
              : "No se pudo cargar el estado en vivo."
          }
          onRetry={() => refetch()}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Sin corridas en curso"
          description="Cuando un fact se esté ejecutando aparecerá aquí con su pipeline en tiempo real y heartbeat del runner."
          action={
            <Button asChild size="sm" className="mt-2">
              <Link href="/etl-monitor/lanzar">Lanzar una corrida</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {data.map((c) => (
            <ActiveRunCard key={c.id} corrida={c} />
          ))}
        </div>
      )}
    </section>
  );
}
