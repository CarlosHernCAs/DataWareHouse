"use client";

import { useMemo } from "react";
import {
  AlertOctagon,
  Database,
  GaugeCircle,
  ShieldAlert,
  ShieldQuestion,
  XCircle,
  Zap,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import { RECHARTS_THEME } from "@/components/charts/recharts-theme";
import {
  useActiveCorridas,
  useActiveAlerts,
  useDwhState,
  useEtlTrend,
  useQualityKpis,
} from "@/hooks/use-control-center";
import { KpiTile, deltaFromCounts, type Tone } from "./kpi-tile";

/**
 * Hero KPI row — 6 tiles.
 *
 * Tile 1: Pipeline Health Score (0–100 composite from today's ETL runs).
 * Tile 2: Active runs right now (real-time via useActiveCorridas 5s poll).
 * Tiles 3–6: Filas 24h · Fallos ETL · Cuarentena · Alertas críticas.
 *
 * El componente visual `KpiTile` (incluida la sparkline lazy) vive en
 * `./kpi-tile.tsx` — este archivo solo orquesta queries y deriva tonos.
 */
export function HeroKpis() {
  const trend = useEtlTrend(14);
  const trendToday = useEtlTrend(1);
  const dwh = useDwhState();
  const quality = useQualityKpis();
  const alerts = useActiveAlerts();
  const activeCorridas = useActiveCorridas();

  const healthScore = useMemo(() => {
    const arr = trendToday.data ?? [];
    if (arr.length === 0) return 100;
    const today = arr[arr.length - 1];
    const total = (today?.success ?? 0) + (today?.failed ?? 0);
    if (total === 0) return 100;
    return Math.round(((today?.success ?? 0) / total) * 100);
  }, [trendToday.data]);

  const fallosInfo = useMemo(() => {
    const arr = trend.data ?? [];
    if (arr.length === 0) return null;
    const hoy = arr[arr.length - 1]?.failed ?? 0;
    const ayer = arr.length >= 2 ? (arr[arr.length - 2]?.failed ?? 0) : null;
    return { hoy, ayer };
  }, [trend.data]);

  const activeCount = (activeCorridas.data ?? []).length;

  const criticalCount = useMemo(() => {
    // Date.now() impuro: el cutoff de 48h se recalcula a cada render del
    // memo, pero solo se invalida cuando cambia `alerts.data`. El drift
    // de la ventana móvil no afecta la coherencia visual.
    // eslint-disable-next-line react-hooks/purity
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    return (alerts.data ?? []).filter(
      (a) =>
        a.severity === "critical" &&
        !a.acknowledged &&
        new Date(a.createdAt).getTime() > cutoff,
    ).length;
  }, [alerts.data]);

  const scoreTone: Tone | undefined =
    healthScore >= 90 ? undefined : healthScore >= 70 ? "warning" : "destructive";

  const activeRunsTone: Tone | undefined = activeCount > 0 ? "info" : undefined;

  const fallosCount = fallosInfo?.hoy ?? 0;
  const fallosTone: Tone | undefined =
    fallosCount >= 3 ? "destructive" : fallosCount >= 1 ? "warning" : undefined;

  const pendientes = quality.data?.pendientes ?? 0;
  const pendientesTone: Tone | undefined =
    pendientes > 20 ? "destructive" : pendientes > 0 ? "warning" : undefined;

  return (
    <section
      aria-label="Indicadores clave"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3"
    >
      <KpiTile
        href="/etl-monitor"
        label="SALUD PIPELINE"
        loading={trendToday.isLoading && !trendToday.data}
        icon={<GaugeCircle aria-hidden className="h-4 w-4" />}
        iconTone={scoreTone ?? "success"}
        value={`${healthScore}`}
        valueSuffix="/100"
        tone={scoreTone}
        progressBar={{ value: healthScore, max: 100 }}
      />

      <KpiTile
        href="/etl-monitor"
        label="EN EJECUCIÓN"
        loading={activeCorridas.isLoading && !activeCorridas.data}
        icon={<Zap aria-hidden className="h-4 w-4" />}
        iconTone={activeRunsTone ?? "success"}
        value={formatNumber(activeCount)}
        tone={activeRunsTone}
        pulseDot={activeCount > 0}
      />

      <KpiTile
        href="/dwh"
        label="FILAS INSERTADAS 24 H"
        loading={dwh.isLoading && !dwh.data}
        icon={<Database aria-hidden className="h-4 w-4" />}
        iconTone="info"
        value={dwh.data ? formatNumber(dwh.data.rowsLast24h) : "—"}
        sparkline={trend.data?.map((p) => ({ value: p.success })) ?? []}
        sparklineColor={RECHARTS_THEME.success}
      />

      <KpiTile
        href="/etl-monitor"
        label="FALLOS ETL 24 H"
        loading={trend.isLoading && !trend.data}
        icon={<XCircle aria-hidden className="h-4 w-4" />}
        iconTone={fallosTone ?? "success"}
        value={formatNumber(fallosCount)}
        tone={fallosTone}
        delta={
          fallosInfo?.ayer != null
            ? deltaFromCounts(fallosInfo.hoy, fallosInfo.ayer)
            : undefined
        }
        sparkline={trend.data?.map((p) => ({ value: p.failed })) ?? []}
        sparklineColor={RECHARTS_THEME.destructive}
      />

      <KpiTile
        href="/quality"
        label="PENDIENTES CUARENTENA"
        loading={quality.isLoading && !quality.data}
        icon={<ShieldQuestion aria-hidden className="h-4 w-4" />}
        iconTone={pendientesTone ?? "success"}
        value={formatNumber(pendientes)}
        tone={pendientesTone}
      />

      <KpiTile
        href="/alerts"
        label="CRÍTICAS SIN ATENDER"
        loading={alerts.isLoading && !alerts.data}
        icon={
          criticalCount > 0 ? (
            <AlertOctagon aria-hidden className="h-4 w-4" />
          ) : (
            <ShieldAlert aria-hidden className="h-4 w-4" />
          )
        }
        iconTone={criticalCount > 0 ? "destructive" : "success"}
        value={formatNumber(criticalCount)}
        tone={criticalCount > 0 ? "destructive" : undefined}
        pulseDot={criticalCount > 0}
      />
    </section>
  );
}
