import type { DwhNode } from "@/lib/schemas/dwh";
import {
  COLLAPSED_W,
  COLUMN_PAD_TOP,
  LAYER_ORDER,
  SVG_PAD_BOTTOM,
  SVG_PAD_X,
  type GeomConfig,
  type Layer,
  type LayerName,
} from "./dwh-lineage-constants";

/**
 * Layout y helpers de texto del lineage graph.
 *
 * `computeLayout` distribuye nodos en 3 columnas (bronce/silver/gold)
 * respetando capas colapsadas. Es puro y memoizable. Los helpers de
 * texto (`truncate`, `shortFact`, `formatRows`) y `nodeMatchesFilter`
 * son compartidos por el orquestador y el componente de nodo.
 */

export interface ColumnInfo {
  left: number;
  width: number;
  collapsed: boolean;
  count: number;
}

export interface Layout {
  positions: Map<string, { x: number; y: number; layer: Layer }>;
  columns: Record<Layer, ColumnInfo>;
  dimensions: { width: number; height: number };
}

export function computeLayout(
  nodes: DwhNode[],
  geom: GeomConfig,
  collapsedLayers: ReadonlySet<LayerName>,
): Layout {
  const positions = new Map<string, { x: number; y: number; layer: Layer }>();
  const columns = {} as Record<Layer, ColumnInfo>;
  let maxRows = 0;
  let cursorX = SVG_PAD_X;
  LAYER_ORDER.forEach((layer) => {
    const inLayer = nodes.filter((n) => n.layer === layer);
    const collapsed = collapsedLayers.has(layer) && inLayer.length > 0;
    const width = collapsed ? COLLAPSED_W : geom.NODE_W;
    columns[layer] = {
      left: cursorX,
      width,
      collapsed,
      count: inLayer.length,
    };
    inLayer.forEach((n, idx) => {
      const y = COLUMN_PAD_TOP + idx * (geom.NODE_H + geom.NODE_GAP_Y);
      positions.set(n.id, { x: cursorX, y, layer });
    });
    if (inLayer.length > maxRows) maxRows = inLayer.length;
    cursorX += width + geom.COLUMN_GAP_X;
  });
  // El último gap sobra → restamos.
  const totalWidth = cursorX - geom.COLUMN_GAP_X + SVG_PAD_X;
  const height =
    COLUMN_PAD_TOP + maxRows * (geom.NODE_H + geom.NODE_GAP_Y) + SVG_PAD_BOTTOM;
  return { positions, columns, dimensions: { width: totalWidth, height } };
}

export function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export function shortFact(s: string): string {
  return s.replace(/^Fact_/, "").replace(/_/g, " ");
}

export function formatRows(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function nodeMatchesFilter(
  nodes: DwhNode[],
  id: string,
  lower: string,
): boolean {
  const n = nodes.find((x) => x.id === id);
  if (!n) return false;
  return (
    n.label.toLowerCase().includes(lower) ||
    n.fullName.toLowerCase().includes(lower) ||
    n.facts.some((f) => f.toLowerCase().includes(lower))
  );
}
