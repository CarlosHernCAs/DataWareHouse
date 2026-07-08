/**
 * lib/hypr/layout-store.ts
 * ========================
 * Persistencia (localStorage) de los layouts de workspace del compositor Hypr.
 *
 * Cada workspace guarda su layout dockview serializado (`api.toJSON()`). Es
 * cliente-only y por-navegador (decisión del plan para el MVP); no viaja entre
 * dispositivos. Para cross-device se migraría al patrón de blob backend usado
 * por el workspace del analista.
 */

import type { SerializedDockview } from "dockview-react";

export const HYPR_WORKSPACES = [1, 2, 3, 4, 5] as const;

export interface HyprLayoutState {
  /** Workspace activo (1..5). */
  active: number;
  /** Layout serializado por workspace. Ausente = workspace vacío. */
  layouts: Record<number, SerializedDockview | undefined>;
}

const KEY = "acp.hypr.layouts.v1";

const DEFAULT_STATE: HyprLayoutState = { active: 1, layouts: {} };

export function loadLayoutState(): HyprLayoutState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<HyprLayoutState>;
    const active =
      typeof parsed.active === "number" &&
      parsed.active >= 1 &&
      parsed.active <= HYPR_WORKSPACES.length
        ? parsed.active
        : 1;
    return {
      active,
      layouts: parsed.layouts && typeof parsed.layouts === "object"
        ? parsed.layouts
        : {},
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveLayoutState(state: HyprLayoutState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* localStorage bloqueado / quota — silenciar */
  }
}
