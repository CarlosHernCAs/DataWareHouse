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

  /**
   * Color del sparkline según la tendencia real de la serie.
   *
   *  - `isGoodWhenHigher = true`  → más volumen = bueno (filas, éxitos).
   *  - `isGoodWhenHigher = false` → más volumen = malo  (fallos).
   *
   * Comparamos el promedio de los últimos 3 puntos vs los anteriores.
   * Si el delta relativo está por debajo de ±10%, la serie está "estable"
   * y mostramos color informativo neutro. Si supera ese umbral, coloreamos
   * según si la dirección es buena o mala. Antes el sparkline de "filas
   * insertadas" siempre era verde aunque la tendencia bajara fuerte.
   */
  function trendColor(serie: number[], isGoodWhenHigher: boolean): string {
    if (serie.length < 4) return RECHARTS_THEME.info;
    const recientes = serie.slice(-3);
    const previos = serie.slice(0, -3);
    const promedio = (xs: number[]) =>
      xs.reduce((a, b) => a + b, 0) / Math.max(xs.length, 1);
    const recent = promedio(recientes);
    const baseline = promedio(previos);
    if (baseline === 0 && recent === 0) return RECHARTS_THEME.info;
    const delta = (recent - baseline) / Math.max(baseline, 1);
    if (Math.abs(delta) < 0.1) return RECHARTS_THEME.info;
    const rising = delta > 0;
    const ok = isGoodWhenHigher ? rising : !rising;
    return ok ? RECHARTS_THEME.success : RECHARTS_THEME.destructive;
  }

  const trendData = trend.data ?? [];
  const filasSerie = trendData.map((p) => p.success);
  const fallosSerie = trendData.map((p) => p.failed);
  const filasSparkColor = trendColor(filasSerie, true);
  const fallosSparkColor = trendColor(fallosSerie, false);

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
        label="Salud del pipeline"
        loading={trendToday.isLoading && !trendToday.data}
        icon={<GaugeCircle aria-hidden className="h-4 w-4" />}
        iconTone={scoreTone ?? "success"}
        value={`${healthScore}`}
        valueSuffix="/100"
        tone={scoreTone}
        progressBar={{ value: healthScore, max: 100 }}
        tooltip="Score = (corridas exitosas hoy / total). Bajo 70 = crítico, 70–89 = aviso."
      />

      <KpiTile
        href="/etl-monitor"
        label="En ejecución"
        loading={activeCorridas.isLoading && !activeCorridas.data}
        icon={<Zap aria-hidden className="h-4 w-4" />}
        iconTone={activeRunsTone ?? "success"}
        value={formatNumber(activeCount)}
        tone={activeRunsTone}
        pulseDot={activeCount > 0}
      />

      <KpiTile
        href="/dwh"
        label="Filas insertadas 24 h"
        loading={dwh.isLoading && !dwh.data}
        icon={<Database aria-hidden className="h-4 w-4" />}
        iconTone="info"
        value={dwh.data ? formatNumber(dwh.data.rowsLast24h) : "—"}
        sparkline={filasSerie.map((v) => ({ value: v }))}
        sparklineColor={filasSparkColor}
      />

      <KpiTile
        href="/etl-monitor"
        label="Fallos ETL 24 h"
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
        sparkline={fallosSerie.map((v) => ({ value: v }))}
        sparklineColor={fallosSparkColor}
        tooltip="Fallos hoy. 1–2 = aviso, ≥ 3 = crítico. Sparkline rojo si la tendencia sube."
      />

      <KpiTile
        href="/quality"
        label="Pendientes en cuarentena"
        loading={quality.isLoading && !quality.data}
        icon={<ShieldQuestion aria-hidden className="h-4 w-4" />}
        iconTone={pendientesTone ?? "success"}
        value={formatNumber(pendientes)}
        tone={pendientesTone}
        tooltip="Registros en cuarentena sin resolver. > 20 = crítico, 1–20 = aviso."
      />

      <KpiTile
        href="/alerts"
        label="Críticas sin atender"
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
        tooltip="Alertas críticas no reconocidas de las últimas 48 horas."
      />
    </section>
  );
}
