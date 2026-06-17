"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DwhMinimap } from "@/components/control-center/dwh-minimap";
import type { DwhEdge, DwhNode, TableStatus } from "@/lib/schemas/dwh";

import {
  COLUMN_PAD_TOP,
  EMPTY_LAYERS,
  GEOM,
  LAYER_HELP,
  LAYER_LABEL,
  LAYER_ORDER,
  STATUS_TOKEN,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  type LayerName,
} from "./dwh-lineage-constants";
import {
  computeLayout,
  formatRows,
  nodeMatchesFilter,
} from "./dwh-lineage-layout";
import { DwhNodeRect } from "./dwh-lineage-node";

/**
 * Orquestador del lineage graph.
 *
 * Responsabilidades:
 *  - Recibir nodos/edges + sets derivados (pathSet, criticalPathSet,
 *    flashSet, pinnedSet) ya calculados por el padre.
 *  - Mantener el viewport local (zoom + pan + scroll-into-view imperativo).
 *  - Renderizar el SVG: headers de capa, edges con label, barras de capa
 *    colapsada y los nodos (delegados a `DwhNodeRect`).
 *
 * Lo que NO hace:
 *  - Cálculo del pathSet / criticalPathSet / flashSet — los recibe ya
 *    resueltos como props (lo decide el panel padre).
 *  - Layout — vive en `dwh-lineage-layout.ts`.
 *  - Constantes geométricas o de color — viven en `dwh-lineage-constants.ts`.
 *  - Render del nodo individual — vive en `dwh-lineage-node.tsx`.
 */

interface DwhLineageGraphProps {
  nodes: DwhNode[];
  edges: DwhEdge[];
  selectedId: string | null;
  /** Segundo nodo en modo compare — recibe anillo secundario. */
  compareId?: string | null;
  filter: string;
  /** BFS desde el nodo seleccionado (upstream+downstream). Vacío si no hay selección. */
  pathSet: Set<string>;
  /** Nodos en el critical path automático (downstream desde failed/warning). */
  criticalPathSet: Set<string>;
  /** Nodos cuyo status acaba de empeorar — flashea brevemente. */
  flashSet: Set<string>;
  /** Nodos pinneados por el usuario — anillo permanente. */
  pinnedSet: ReadonlySet<string>;
  /** Status visibles. Los nodos con status fuera del set se atenúan. */
  statusFilter: Set<TableStatus>;
  /** Capas visibles. Los nodos de capas fuera del set se atenúan. */
  layerFilter?: Set<LayerName>;
  /** Capas colapsadas — renderizan barra delgada en vez de cards. */
  collapsedLayers?: ReadonlySet<LayerName>;
  density: "comfortable" | "compact";
  onSelect: (id: string) => void;
  /** Click derecho sobre un nodo — el padre decide qué hacer. Coords en `client*`. */
  onNodeContextMenu?: (id: string, x: number, y: number) => void;
  /** Shift+click sobre un nodo — para activar modo compare. */
  onCompareClick?: (id: string) => void;
  /** Toggle del colapso de una capa desde el header. */
  onToggleCollapseLayer?: (layer: LayerName) => void;
}

export interface DwhLineageGraphHandle {
  /** Aciona "centrar la vista en el nodo X". Se usa al navegar con teclado. */
  scrollToNode: (id: string) => void;
}

export const DwhLineageGraph = forwardRef<DwhLineageGraphHandle, DwhLineageGraphProps>(
  function DwhLineageGraph(
    {
      nodes,
      edges,
      selectedId,
      compareId,
      filter,
      pathSet,
      criticalPathSet,
      flashSet,
      pinnedSet,
      statusFilter,
      layerFilter,
      collapsedLayers,
      density,
      onSelect,
      onNodeContextMenu,
      onCompareClick,
      onToggleCollapseLayer,
    },
    ref,
  ) {
    const geom = GEOM[density];
    const collapsed = collapsedLayers ?? EMPTY_LAYERS;
    const layout = useMemo(
      () => computeLayout(nodes, geom, collapsed),
      [nodes, geom, collapsed],
    );
    const lowerFilter = filter.trim().toLowerCase();

    const matchesFilter = (n: DwhNode): boolean =>
      !lowerFilter ||
      n.label.toLowerCase().includes(lowerFilter) ||
      n.fullName.toLowerCase().includes(lowerFilter) ||
      n.facts.some((f) => f.toLowerCase().includes(lowerFilter));

    const passesStatus = (n: DwhNode): boolean => statusFilter.has(n.status);
    const passesLayer = (n: DwhNode): boolean => !layerFilter || layerFilter.has(n.layer);

    const isDimmed = (id: string): boolean => {
      // Si hay critical-path activo, los que NO están en él se atenúan.
      if (criticalPathSet.size > 0 && !criticalPathSet.has(id)) return true;
      if (selectedId && !pathSet.has(id)) return true;
      const n = nodes.find((x) => x.id === id);
      if (!n) return true;
      if (!passesStatus(n)) return true;
      if (!passesLayer(n)) return true;
      if (lowerFilter && !matchesFilter(n)) return true;
      return false;
    };

    const isHighlighted = (id: string): boolean =>
      !!lowerFilter && nodeMatchesFilter(nodes, id, lowerFilter);

    /* ---------- Zoom + pan state ---------- */
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
      null,
    );
    const scrollHostRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }, [nodes.length, density, collapsed]);

    // Imperativo: scroll-into-view del nodo (para keyboard nav).
    useImperativeHandle(
      ref,
      () => ({
        scrollToNode: (id: string) => {
          const host = scrollHostRef.current;
          const pos = layout.positions.get(id);
          if (!host || !pos) return;
          const cx = (pos.x + geom.NODE_W / 2) * zoom + pan.x;
          const cy = (pos.y + geom.NODE_H / 2) * zoom + pan.y;
          const targetLeft = cx - host.clientWidth / 2;
          const targetTop = cy - host.clientHeight / 2;
          // Solo desplazamos si el nodo está fuera del viewport visible.
          const visibleLeft = host.scrollLeft;
          const visibleRight = visibleLeft + host.clientWidth;
          const visibleTop = host.scrollTop;
          const visibleBottom = visibleTop + host.clientHeight;
          const nodeLeft = cx - geom.NODE_W * zoom * 0.5;
          const nodeRight = cx + geom.NODE_W * zoom * 0.5;
          const nodeTop = cy - geom.NODE_H * zoom * 0.5;
          const nodeBottom = cy + geom.NODE_H * zoom * 0.5;
          const xOutside = nodeRight > visibleRight || nodeLeft < visibleLeft;
          const yOutside = nodeBottom > visibleBottom || nodeTop < visibleTop;
          if (!xOutside && !yOutside) return;
          host.scrollTo({
            left: Math.max(0, targetLeft),
            top: Math.max(0, targetTop),
            behavior: "smooth",
          });
        },
      }),
      [layout, geom, zoom, pan],
    );

    const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      const target = e.target as Element;
      if (target.closest("[data-dwh-node]")) return;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    };
    const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragRef.current) return;
      setPan({
        x: dragRef.current.panX + (e.clientX - dragRef.current.x),
        y: dragRef.current.panY + (e.clientY - dragRef.current.y),
      });
    };
    const onPointerUp = () => {
      dragRef.current = null;
    };

    const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
    const zoomOut = () =>
      setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
    const resetView = () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };

    const { width, height } = layout.dimensions;

    // Lookup rápido para el cálculo de edge labels.
    const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

    return (
      <TooltipProvider delayDuration={250} disableHoverableContent>
        <div
          role="figure"
          aria-label="Mapa de lineage Bronce, Silver y Gold del Data Warehouse"
          className="bg-surface relative overflow-hidden rounded-lg border border-[var(--color-border)]"
          style={{ maxWidth: "70%" }}
        >
          <ViewportControls
            zoom={zoom}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetView}
          />

          <div
            ref={scrollHostRef}
            className="overflow-auto"
            style={{ maxHeight: "min(80vh, 700px)" }}
          >
            <svg
              viewBox={`0 0 ${width} ${height}`}
              width={width * zoom}
              height={height * zoom}
              style={{ minWidth: width * zoom, height: height * zoom }}
              className={cn(
                "block touch-none select-none",
                // eslint-disable-next-line react-hooks/refs
                dragRef.current ? "cursor-grabbing" : "cursor-grab",
              )}
              role="img"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <defs>
                <marker
                  id="dwh-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M 0 0 L 10 5 L 0 10 z"
                    fill="var(--color-text-muted)"
                    opacity="0.7"
                  />
                </marker>
                <marker
                  id="dwh-arrow-active"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-primary)" />
                </marker>
                <marker
                  id="dwh-arrow-critical"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-destructive)" />
                </marker>
                <filter id="dwh-pin-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g transform={`translate(${pan.x} ${pan.y})`}>
                {/* Layer headers + toggle de colapso */}
                {LAYER_ORDER.map((layer) => {
                  const col = layout.columns[layer];
                  const cx = col.left + col.width / 2;
                  const isCollapsed = col.collapsed;
                  return (
                    <g key={`hdr-${layer}`}>
                      <text
                        x={cx}
                        y={22}
                        textAnchor="middle"
                        style={{
                          font: "600 13px var(--font-inter, sans-serif)",
                          writingMode: isCollapsed ? "vertical-rl" : undefined,
                        } as React.CSSProperties}
                        className="fill-[var(--color-text)]"
                      >
                        {LAYER_LABEL[layer]}
                      </text>
                      {!isCollapsed ? (
                        <text
                          x={cx}
                          y={38}
                          textAnchor="middle"
                          style={{ font: "400 10px var(--font-inter, sans-serif)" }}
                          className="fill-[var(--color-text-muted)]"
                        >
                          {LAYER_HELP[layer]}
                        </text>
                      ) : null}
                      {onToggleCollapseLayer && col.count > 0 ? (
                        <g
                          role="button"
                          tabIndex={0}
                          aria-label={
                            isCollapsed
                              ? `Expandir capa ${LAYER_LABEL[layer]}`
                              : `Colapsar capa ${LAYER_LABEL[layer]}`
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCollapseLayer(layer);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onToggleCollapseLayer(layer);
                            }
                          }}
                          className="cursor-pointer outline-none"
                          transform={`translate(${col.left + col.width - 14} 8)`}
                        >
                          <circle r={7} fill="var(--color-surface-2)" stroke="var(--color-border)" />
                          {isCollapsed ? (
                            <ChevronRight
                              x={-4}
                              y={-4}
                              width={8}
                              height={8}
                              stroke="var(--color-text-secondary)"
                              strokeWidth={2}
                              fill="none"
                            />
                          ) : (
                            <ChevronLeft
                              x={-4}
                              y={-4}
                              width={8}
                              height={8}
                              stroke="var(--color-text-secondary)"
                              strokeWidth={2}
                              fill="none"
                            />
                          )}
                        </g>
                      ) : null}
                    </g>
                  );
                })}

                {/* Edges */}
                <g aria-hidden="true">
                  {edges.map((e, idx) => {
                    const a = layout.positions.get(e.from);
                    const b = layout.positions.get(e.to);
                    if (!a || !b) return null;
                    const colA = layout.columns[a.layer];
                    const colB = layout.columns[b.layer];
                    const x1 = colA.left + colA.width;
                    const y1 = colA.collapsed
                      ? COLUMN_PAD_TOP + (colA.count * (geom.NODE_H + geom.NODE_GAP_Y)) / 2
                      : a.y + geom.NODE_H / 2;
                    const x2 = colB.left;
                    const y2 = colB.collapsed
                      ? COLUMN_PAD_TOP + (colB.count * (geom.NODE_H + geom.NODE_GAP_Y)) / 2
                      : b.y + geom.NODE_H / 2;
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
                    const inPath =
                      selectedId && pathSet.has(e.from) && pathSet.has(e.to);
                    const isCritical =
                      criticalPathSet.size > 0 &&
                      criticalPathSet.has(e.from) &&
                      criticalPathSet.has(e.to);
                    const dim = isDimmed(e.from) || isDimmed(e.to);
                    const stroke = isCritical
                      ? "var(--color-destructive)"
                      : inPath
                        ? "var(--color-primary)"
                        : "var(--color-text-muted)";
                    const marker = isCritical
                      ? "url(#dwh-arrow-critical)"
                      : inPath
                        ? "url(#dwh-arrow-active)"
                        : "url(#dwh-arrow)";
                    // Etiqueta de throughput sólo en edges de flujo (no dependencia)
                    // que tienen actividad o rechazos.
                    const src = nodeById.get(e.from);
                    const showLabel =
                      e.kind === "flow" &&
                      !dim &&
                      src != null &&
                      (src.rowsLast24h > 0 || src.rejectedLast24h > 0);
                    return (
                      <g key={`edge-${idx}`}>
                        <path
                          d={d}
                          fill="none"
                          stroke={stroke}
                          strokeWidth={isCritical ? 2 : inPath ? 1.8 : 1.1}
                          strokeDasharray={
                            e.kind === "dependency" ? "4 4" : undefined
                          }
                          opacity={
                            dim ? 0.12 : isCritical ? 0.95 : inPath ? 0.9 : 0.4
                          }
                          markerEnd={marker}
                        />
                        {showLabel && src ? (
                          <EdgeLabel
                            x={midX}
                            y={midY}
                            rows={src.rowsLast24h}
                            rejected={src.rejectedLast24h}
                            tone={isCritical ? "critical" : inPath ? "active" : "muted"}
                          />
                        ) : null}
                      </g>
                    );
                  })}
                </g>

                {/* Barras de capa colapsada */}
                <g>
                  {LAYER_ORDER.map((layer) => {
                    const col = layout.columns[layer];
                    if (!col.collapsed || col.count === 0) return null;
                    const barY = COLUMN_PAD_TOP;
                    const barH = col.count * (geom.NODE_H + geom.NODE_GAP_Y) - geom.NODE_GAP_Y;
                    return (
                      <g
                        key={`bar-${layer}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Capa ${LAYER_LABEL[layer]} colapsada con ${col.count} tablas — click para expandir`}
                        onClick={() => onToggleCollapseLayer?.(layer)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onToggleCollapseLayer?.(layer);
                          }
                        }}
                        className="cursor-pointer outline-none"
                      >
                        <rect
                          x={col.left}
                          y={barY}
                          width={col.width}
                          height={barH}
                          rx={6}
                          fill="var(--color-surface-2)"
                          stroke="var(--color-border)"
                        />
                        <text
                          x={col.left + col.width / 2}
                          y={barY + barH / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            font: "600 11px var(--font-jetbrains-mono, monospace)",
                            writingMode: "vertical-rl",
                          } as React.CSSProperties}
                          className="fill-[var(--color-text-secondary)]"
                        >
                          {col.count}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Nodes (solo capas no colapsadas) */}
                <g>
                  {nodes.map((n) => {
                    const pos = layout.positions.get(n.id);
                    if (!pos) return null;
                    if (layout.columns[pos.layer].collapsed) return null;
                    return (
                      <DwhNodeRect
                        key={n.id}
                        node={n}
                        x={pos.x}
                        y={pos.y}
                        geom={geom}
                        selected={selectedId === n.id}
                        compare={compareId === n.id}
                        dim={isDimmed(n.id)}
                        highlighted={isHighlighted(n.id)}
                        pinned={pinnedSet.has(n.id)}
                        flashing={flashSet.has(n.id)}
                        critical={criticalPathSet.has(n.id)}
                        onSelect={onSelect}
                        onContextMenu={onNodeContextMenu}
                        onCompareClick={onCompareClick}
                      />
                    );
                  })}
                </g>
              </g>
            </svg>
          </div>

          <DwhMinimap
            scrollContainerRef={scrollHostRef}
            worldWidth={width}
            worldHeight={height}
            zoom={zoom}
            nodes={nodes}
            positions={layout.positions}
            nodeWidth={geom.NODE_W}
            nodeHeight={geom.NODE_H}
          />
        </div>
      </TooltipProvider>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Edge label                                                                  */
/* -------------------------------------------------------------------------- */

function EdgeLabel({
  x,
  y,
  rows,
  rejected,
  tone,
}: {
  x: number;
  y: number;
  rows: number;
  rejected: number;
  tone: "muted" | "active" | "critical";
}) {
  const text = rows > 0 ? `${formatRows(rows)} · 24h` : "0 · 24h";
  const color =
    tone === "critical"
      ? "var(--color-destructive)"
      : tone === "active"
        ? "var(--color-primary)"
        : "var(--color-text-secondary)";
  // Padding visual sobre la línea: rect translúcido detrás del texto.
  const padX = 4;
  const padY = 1.5;
  // Aproximación de ancho: 6.2px por carácter para 10px font.
  const approxW = text.length * 6.2 + padX * 2 + (rejected > 0 ? 12 : 0);
  return (
    <g aria-hidden>
      <rect
        x={x - approxW / 2}
        y={y - 8}
        width={approxW}
        height={14}
        rx={3}
        fill="var(--color-surface)"
        opacity={0.92}
      />
      <rect
        x={x - approxW / 2}
        y={y - 8}
        width={approxW}
        height={14}
        rx={3}
        fill="none"
        stroke={color}
        strokeOpacity={0.25}
      />
      {rejected > 0 ? (
        <>
          <text
            x={x - approxW / 2 + padX + 1}
            y={y + padY + 1}
            style={{ font: "600 9px var(--font-inter, sans-serif)" }}
            fill="var(--color-warning)"
          >
            ⚠
          </text>
          <text
            x={x - approxW / 2 + padX + 13}
            y={y + padY + 1}
            style={{ font: "500 9.5px var(--font-jetbrains-mono, monospace)" }}
            fill={color}
          >
            {text}
          </text>
        </>
      ) : (
        <text
          x={x}
          y={y + padY + 1}
          textAnchor="middle"
          style={{ font: "500 9.5px var(--font-jetbrains-mono, monospace)" }}
          fill={color}
        >
          {text}
        </text>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Viewport controls (floating top-right)                                      */
/* -------------------------------------------------------------------------- */

function ViewportControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Controles de vista"
      className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-1 shadow-sm backdrop-blur"
    >
      <CtrlBtn label="Reducir zoom" onClick={onZoomOut} disabled={zoom <= ZOOM_MIN}>
        <Minus className="h-3.5 w-3.5" />
      </CtrlBtn>
      <span
        className="min-w-[3rem] text-center text-[11px] tabular-nums text-[var(--color-text-muted)]"
        aria-live="polite"
      >
        {Math.round(zoom * 100)}%
      </span>
      <CtrlBtn label="Aumentar zoom" onClick={onZoomIn} disabled={zoom >= ZOOM_MAX}>
        <Plus className="h-3.5 w-3.5" />
      </CtrlBtn>
      <span aria-hidden className="mx-0.5 h-4 w-px bg-[var(--color-border)]" />
      <CtrlBtn label="Restaurar vista" onClick={onReset}>
        <RotateCcw className="h-3.5 w-3.5" />
      </CtrlBtn>
    </div>
  );
}

function CtrlBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-sm text-[var(--color-text-secondary)] transition",
        "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Legend                                                                     */
/* -------------------------------------------------------------------------- */

interface LegendProps {
  className?: string;
}

export function DwhLineageLegend({ className }: LegendProps) {
  const items: { label: string; status: TableStatus }[] = [
    { label: "OK", status: "ok" },
    { label: "Advertencia", status: "warning" },
    { label: "Falló", status: "failed" },
    { label: "Stale (> 3 d)", status: "stale" },
    { label: "Sin datos", status: "unknown" },
  ];
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-text-muted)]",
        className,
      )}
    >
      {items.map((it) => (
        <span key={it.status} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: STATUS_TOKEN[it.status].dot }}
          />
          {it.label}
        </span>
      ))}
      <span aria-hidden className="text-[var(--color-text-muted)]">·</span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="22" height="6" aria-hidden>
          <line
            x1="0"
            y1="3"
            x2="22"
            y2="3"
            stroke="var(--color-text-muted)"
            strokeDasharray="3 3"
          />
        </svg>
        dependencia entre facts
      </span>
      <span aria-hidden className="text-[var(--color-text-muted)]">·</span>
      <span className="inline-flex items-center gap-1.5">
        <Maximize2 aria-hidden className="h-3 w-3" />
        click + drag para pan · ? atajos
      </span>
      <span aria-hidden className="text-[var(--color-text-muted)]">·</span>
      <span className="inline-flex items-center gap-1.5">
        <AlertTriangle aria-hidden className="h-3 w-3 text-[var(--color-warning)]" />
        ⚠ en edge: filas rechazadas en 24h
      </span>
    </div>
  );
}
