import type { TableStatus } from "@/lib/schemas/dwh";

/**
 * Constantes geométricas y tokens visuales del lineage graph.
 *
 * Extraídos de `dwh-lineage-graph.tsx` para que el orquestador, el
 * componente de nodo y el helper de layout compartan los mismos
 * valores sin acoplarse al render.
 */

export type LayerName = "bronce" | "silver" | "gold";

export const GEOM = {
  comfortable: {
    NODE_W: 188,
    NODE_H: 52,
    NODE_GAP_Y: 8,
    COLUMN_GAP_X: 64,
    LABEL_MAX: 20,
  },
  compact: {
    NODE_W: 156,
    NODE_H: 36,
    NODE_GAP_Y: 4,
    COLUMN_GAP_X: 48,
    LABEL_MAX: 16,
  },
} as const;

export type GeomConfig = (typeof GEOM)[keyof typeof GEOM];

export const COLUMN_PAD_TOP = 56;
export const SVG_PAD_X = 24;
export const SVG_PAD_BOTTOM = 24;
export const COLLAPSED_W = 24;

export const LAYER_ORDER = ["bronce", "silver", "gold"] as const;
export type Layer = (typeof LAYER_ORDER)[number];

export const LAYER_LABEL: Record<Layer, string> = {
  bronce: "Bronce",
  silver: "Silver",
  gold: "Gold",
};

export const LAYER_HELP: Record<Layer, string> = {
  bronce: "Raw ingestado desde Excel/SAP",
  silver: "Facts canónicos validados",
  gold: "Marts agregados para BI",
};

export const STATUS_TOKEN: Record<TableStatus, { dot: string; ring: string }> = {
  ok: {
    dot: "var(--color-success)",
    ring: "color-mix(in oklab, var(--color-success) 60%, transparent)",
  },
  warning: {
    dot: "var(--color-warning)",
    ring: "color-mix(in oklab, var(--color-warning) 60%, transparent)",
  },
  failed: {
    dot: "var(--color-destructive)",
    ring: "color-mix(in oklab, var(--color-destructive) 60%, transparent)",
  },
  stale: {
    dot: "var(--color-text-muted)",
    ring: "var(--color-border)",
  },
  unknown: {
    dot: "var(--color-text-muted)",
    ring: "var(--color-border)",
  },
};

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.2;

export const EMPTY_LAYERS: ReadonlySet<LayerName> = new Set();
