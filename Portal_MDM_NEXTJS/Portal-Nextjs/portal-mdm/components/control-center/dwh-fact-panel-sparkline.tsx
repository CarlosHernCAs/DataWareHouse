"use client";

/**
 * components/control-center/dwh-fact-panel-sparkline.tsx
 * =======================================================
 * Componente SVG inline que traza la duración histórica de las últimas
 * N cargas de un nodo del DWH. Sin dependencias externas más allá de
 * React — usable de forma aislada en cualquier surface.
 */

/* ── Sparkline ───────────────────────────────────────────────────────────── */

export function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1; // evita división por cero

  const pts = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 -10 100 120"
      className="h-full w-full preserve-aspect-ratio-none overflow-visible"
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
      {data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="var(--color-surface)"
            stroke="var(--color-primary)"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}
