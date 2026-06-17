"use client";

import { useMemo } from "react";
import { Pin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { DwhNode, TableStatus } from "@/lib/schemas/dwh";

import {
  STATUS_TOKEN,
  type GeomConfig,
} from "./dwh-lineage-constants";
import {
  formatRows,
  shortFact,
  truncate,
} from "./dwh-lineage-layout";

/**
 * Componente de nodo del lineage graph.
 *
 * Renderiza un rect SVG + sparkline mock + tooltip. Toda la lógica
 * visual (selección, compare, dim, highlight, pin, flash, critical)
 * llega como props ya derivadas por el orquestador — este componente
 * no decide qué nodos están pinneados ni a qué pathSet pertenecen.
 */

interface DwhNodeRectProps {
  node: DwhNode;
  x: number;
  y: number;
  geom: GeomConfig;
  selected: boolean;
  compare: boolean;
  dim: boolean;
  highlighted: boolean;
  pinned: boolean;
  flashing: boolean;
  critical: boolean;
  onSelect: (id: string) => void;
  onContextMenu?: (id: string, x: number, y: number) => void;
  onCompareClick?: (id: string) => void;
}

export function DwhNodeRect({
  node,
  x,
  y,
  geom,
  selected,
  compare,
  dim,
  highlighted,
  pinned,
  flashing,
  critical,
  onSelect,
  onContextMenu,
  onCompareClick,
}: DwhNodeRectProps) {
  const palette = STATUS_TOKEN[node.status];
  const aria =
    `${node.layer === "silver" ? "Fact" : "Tabla"} ${node.fullName}, ` +
    `estado ${node.status}, ${node.rowsLast24h} filas en últimas 24 h` +
    (pinned ? ", fijado" : "");

  const strokeColor = pinned
    ? "var(--color-primary)"
    : critical
      ? "var(--color-destructive)"
      : compare
        ? "var(--color-info)"
        : selected
          ? "var(--color-primary)"
          : highlighted
            ? "var(--color-ring)"
            : palette.ring;
  const strokeWidth = pinned
    ? 2.2
    : selected
      ? 2
      : compare
        ? 2
        : critical
          ? 1.8
          : highlighted
            ? 1.5
            : 1;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <g
          data-dwh-node
          role="button"
          tabIndex={0}
          aria-label={aria}
          aria-pressed={selected}
          onClick={(e) => {
            // Shift+click → modo compare (si el host lo soporta).
            if (e.shiftKey && onCompareClick) {
              e.preventDefault();
              onCompareClick(node.id);
              return;
            }
            onSelect(node.id);
          }}
          onContextMenu={(e) => {
            if (!onContextMenu) return;
            e.preventDefault();
            onContextMenu(node.id, e.clientX, e.clientY);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(node.id);
            }
          }}
          className={cn(
            "cursor-pointer outline-none transition-opacity",
            flashing && "dwh-node-flash",
          )}
          style={{ opacity: dim ? 0.32 : 1 }}
        >
          {pinned ? (
            <rect
              x={x - 2}
              y={y - 2}
              width={geom.NODE_W + 4}
              height={geom.NODE_H + 4}
              rx={10}
              ry={10}
              fill="none"
              stroke="var(--color-primary)"
              strokeOpacity={0.35}
              strokeWidth={1.5}
              filter="url(#dwh-pin-glow)"
            />
          ) : null}
          <rect
            x={x}
            y={y}
            width={geom.NODE_W}
            height={geom.NODE_H}
            rx={8}
            ry={8}
            fill="var(--color-surface-2)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <circle cx={x + 14} cy={y + 14} r={4} fill={palette.dot} />
          <text
            x={x + 28}
            y={y + 18}
            style={{ font: "500 12px var(--font-jetbrains-mono, monospace)" }}
            className="fill-[var(--color-text)]"
          >
            {truncate(node.label, geom.LABEL_MAX - (pinned ? 2 : 0))}
          </text>
          {pinned ? (
            <g transform={`translate(${x + geom.NODE_W - 16} ${y + 8})`}>
              <circle r={6} fill="var(--color-primary)" opacity={0.18} />
              <Pin
                width={9}
                height={9}
                x={-4.5}
                y={-4.5}
                strokeWidth={2}
                stroke="var(--color-primary)"
                fill="none"
              />
            </g>
          ) : null}
          {geom.NODE_H >= 52 ? (
            <>
              <text
                x={x + 14}
                y={y + 36}
                style={{ font: "400 10px var(--font-inter, sans-serif)" }}
                className={node.rowsLast24h > 0 ? "fill-[var(--color-text-secondary)]" : "fill-[var(--color-text-muted)] opacity-70"}
              >
                {node.rowsLast24h > 0
                  ? `${formatRows(node.rowsLast24h)} filas / 24h`
                  : node.lastLoadAt
                    ? `última: ${formatDateTime(node.lastLoadAt).split(",")[0]}`
                    : "sin datos recientes"}
              </text>
              {node.layer !== "silver" && node.facts.length > 0 ? (
                <text
                  x={x + 14}
                  y={y + 50}
                  style={{ font: "400 9px var(--font-inter, sans-serif)" }}
                  className="fill-[var(--color-text-muted)]"
                >
                  {node.facts.length === 1
                    ? `→ ${shortFact(node.facts[0])}`
                    : `→ ${node.facts.length} facts`}
                </text>
              ) : null}
              <NodeSparkline
                x={x + geom.NODE_W - 70}
                y={y + 32}
                w={56}
                h={16}
                seed={node.id}
                latest={node.rowsLast24h}
                status={node.status}
              />
            </>
          ) : null}
        </g>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-xs px-3 py-2"
      >
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold text-[var(--color-text)]">
            {node.fullName}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: palette.dot }}
            />
            <span className="capitalize">{node.status}</span>
            <span aria-hidden>·</span>
            <span>
              {node.lastLoadAt
                ? `cargado ${formatDateTime(node.lastLoadAt)}`
                : "sin cargas"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px]">
            <span className="tabular-nums">
              <span className="text-[var(--color-text-muted)]">filas 24h: </span>
              <span className="font-medium text-[var(--color-text)]">
                {formatNumber(node.rowsLast24h)}
              </span>
            </span>
            <span className="tabular-nums">
              <span className="text-[var(--color-text-muted)]">rechazadas: </span>
              <span
                className={cn(
                  "font-medium",
                  node.rejectedLast24h > 0
                    ? "text-[var(--color-warning)]"
                    : "text-[var(--color-text)]",
                )}
              >
                {formatNumber(node.rejectedLast24h)}
              </span>
            </span>
          </div>
          {pinned ? (
            <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-[var(--color-primary)]">
              <Pin aria-hidden className="h-3 w-3" />
              Nodo fijado por ti
            </div>
          ) : null}
          {node.facts.length > 0 ? (
            <div className="mt-1 text-[10px] text-[var(--color-text-muted)]">
              {node.facts.length === 1
                ? `Asociado a ${shortFact(node.facts[0])}`
                : `${node.facts.length} facts asociados`}
            </div>
          ) : null}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/* -------------------------------------------------------------------------- */
/* Sparkline (mock determinístico hasta tener endpoint /timeseries)            */
/* -------------------------------------------------------------------------- */

function NodeSparkline({
  x,
  y,
  w,
  h,
  seed,
  latest,
  status,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  seed: string;
  latest: number;
  status: TableStatus;
}) {
  // Generamos 7 puntos determinísticos por nodo. El último punto = `latest`
  // real para anclar la mini-línea a un valor confiable. El resto es ±25%
  // alrededor de `latest` o un fallback chico si no hay datos.
  const points = useMemo(() => mockSeries(seed, latest, 7), [seed, latest]);
  if (latest <= 0 && points.every((p) => p === 0)) return null;
  const max = Math.max(1, ...points);
  const stroke =
    status === "failed"
      ? "var(--color-destructive)"
      : status === "warning"
        ? "var(--color-warning)"
        : status === "stale"
          ? "var(--color-text-muted)"
          : "var(--color-success)";
  const d = points
    .map((p, i) => {
      const px = x + (i / (points.length - 1)) * w;
      const py = y + h - (p / max) * h;
      return `${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`;
    })
    .join(" ");
  return (
    <g aria-hidden opacity={0.85}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.2} />
      {/* Punto final destacado */}
      <circle
        cx={x + w}
        cy={y + h - (points[points.length - 1] / max) * h}
        r={1.6}
        fill={stroke}
      />
    </g>
  );
}

function mockSeries(seed: string, latest: number, n: number): number[] {
  // Hash determinista del seed (FNV-1a 32-bit-ish, suficiente para variar).
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const base = latest > 0 ? latest : ((h >>> 0) % 1500) + 200;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    // PRNG simple basado en h.
    h = Math.imul(h ^ i, 2654435761);
    const noise = ((h >>> 8) & 0xffff) / 0xffff; // [0,1)
    const swing = (noise - 0.5) * 0.5; // ±25%
    out.push(Math.max(0, Math.round(base * (1 + swing))));
  }
  // Anclar el último punto al valor real.
  if (latest > 0) out[out.length - 1] = latest;
  return out;
}
