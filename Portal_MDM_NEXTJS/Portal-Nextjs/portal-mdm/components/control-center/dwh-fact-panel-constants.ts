/**
 * components/control-center/dwh-fact-panel-constants.ts
 * ======================================================
 * Tokens visuales y mapas de etiqueta para DwhFactPanel.
 * Sin dependencias de React — importable en cualquier contexto.
 */

import type { TableStatus } from "@/lib/schemas/dwh";
import type { Tone } from "@/lib/status";

export const LAYER_LABEL = {
  bronce: "Bronce",
  silver: "Silver",
  gold: "Gold",
} as const;

export const STATUS_TONE: Record<TableStatus, Tone> = {
  ok: "ok",
  warning: "warning",
  failed: "critical",
  stale: "neutral",
  unknown: "neutral",
};
