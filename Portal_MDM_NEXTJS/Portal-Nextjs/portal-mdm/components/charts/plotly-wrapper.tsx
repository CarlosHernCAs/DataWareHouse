"use client";

import dynamic from "next/dynamic";
import type { Layout, Data, Config } from "plotly.js";
import { RECHARTS_THEME } from "./recharts-theme";

/**
 * Plot dinámico usando `plotly.js-dist-min` (la build minificada) vía
 * `react-plotly.js/factory`. El otro consumidor del portal
 * (`components/analyst/plotly-widget.tsx`) usa exactamente el mismo
 * patrón, así que Turbopack los empaca en un **único chunk compartido**
 * en vez de duplicar Plotly en dos chunks de ~4.5MB cada uno como antes.
 *
 * Ver `docs/decisiones/2026-06-17-bundle-analyzer.md` para el hallazgo.
 */
const Plot = dynamic(
  () =>
    import("react-plotly.js/factory").then(({ default: createPlotlyComponent }) =>
      import("plotly.js-dist-min").then((Plotly) =>
        createPlotlyComponent(Plotly as unknown as Parameters<typeof createPlotlyComponent>[0]),
      ),
    ),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-busy="true"
        className="bg-[var(--color-surface-2)] flex h-64 w-full items-center justify-center rounded-md text-xs text-[var(--color-text-muted)]"
      >
        Cargando gráfico…
      </div>
    ),
  },
);

interface PlotlyChartProps {
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  height?: number;
  className?: string;
}

export function PlotlyChart({
  data,
  layout,
  config,
  height = 320,
  className,
}: PlotlyChartProps) {
  const themedLayout: Partial<Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { family: "Inter, sans-serif", color: RECHARTS_THEME.textMuted, size: 12 },
    margin: { l: 50, r: 20, t: 30, b: 40 },
    xaxis: { gridcolor: RECHARTS_THEME.border, zerolinecolor: RECHARTS_THEME.border },
    yaxis: { gridcolor: RECHARTS_THEME.border, zerolinecolor: RECHARTS_THEME.border },
    colorway: [
      RECHARTS_THEME.primary,
      RECHARTS_THEME.success,
      RECHARTS_THEME.warning,
      RECHARTS_THEME.info,
      RECHARTS_THEME.destructive,
    ],
    ...layout,
  };

  return (
    <div className={className} style={{ height }}>
      <Plot
        data={data}
        layout={themedLayout}
        config={{ displaylogo: false, responsive: true, ...config }}
        style={{ width: "100%", height: "100%" }}
        useResizeHandler
      />
    </div>
  );
}
