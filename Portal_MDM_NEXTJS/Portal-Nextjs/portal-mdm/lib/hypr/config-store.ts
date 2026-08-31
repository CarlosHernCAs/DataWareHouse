/**
 * lib/hypr/config-store.ts
 * ========================
 * Configuración del compositor Hypr, estilo "hyprland.conf" (solo admin).
 *
 * Persiste apariencia y nombres de workspace en `localStorage` (cliente-only,
 * por-navegador) bajo la clave `acp.hypr.config.v1`. Espeja la disciplina de
 * `components/providers/preferencias-provider.tsx`: `useSyncExternalStore` con
 * snapshot cacheado (misma referencia si no cambia) + un evento custom para
 * sincronía intra-pestaña, y es SSR-safe (snapshot de servidor = defaults).
 *
 * No hay Provider: el store es un singleton de módulo y el hook
 * `useHyprConfig()` se puede consumir desde cualquier componente cliente.
 */

import { HYPR_WORKSPACES } from "./layout-store";
import { useCallback, useSyncExternalStore } from "react";

export interface HyprConfig {
  /** Separación (px) entre tiles del mosaico dockview (0–20). */
  gapTiles: number;
  /** Blur en waybar / dock / overlays translúcidos. */
  blur: boolean;
  /** Habilita las animaciones del compositor. */
  animaciones: boolean;
  /** Nombres de los workspaces 1..5. Vacío/ausente = se muestra el número. */
  workspaceNames: Record<number, string>;
}

const KEY = "acp.hypr.config.v1";
const STORAGE_EVENT = "acp.hypr.config.changed";

/** Límites del gap expuestos para el slider de la UI. */
export const GAP_TILES_MIN = 0;
export const GAP_TILES_MAX = 20;

export const HYPR_CONFIG_DEFAULTS: HyprConfig = {
  gapTiles: 8,
  blur: true,
  animaciones: true,
  workspaceNames: {},
};

function clampGap(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : HYPR_CONFIG_DEFAULTS.gapTiles;
  return Math.min(GAP_TILES_MAX, Math.max(GAP_TILES_MIN, v));
}

/** Sanea `workspaceNames`: solo claves 1..5 y valores string recortados. */
function sanitizeNames(raw: unknown): Record<number, string> {
  const out: Record<number, string> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const ws of HYPR_WORKSPACES) {
    const v = (raw as Record<string, unknown>)[String(ws)];
    if (typeof v === "string" && v.trim()) out[ws] = v.trim();
  }
  return out;
}

function readConfig(): HyprConfig {
  if (typeof window === "undefined") return HYPR_CONFIG_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return HYPR_CONFIG_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<HyprConfig>;
    return {
      gapTiles: clampGap(parsed.gapTiles),
      blur: typeof parsed.blur === "boolean" ? parsed.blur : HYPR_CONFIG_DEFAULTS.blur,
      animaciones:
        typeof parsed.animaciones === "boolean"
          ? parsed.animaciones
          : HYPR_CONFIG_DEFAULTS.animaciones,
      workspaceNames: sanitizeNames(parsed.workspaceNames),
    };
  } catch {
    return HYPR_CONFIG_DEFAULTS;
  }
}

function writeConfig(cfg: HyprConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    /* localStorage bloqueado / quota — silenciar */
  }
}

/**
 * Cache del snapshot — `useSyncExternalStore` exige que `getSnapshot`
 * retorne la MISMA referencia mientras los datos no cambien; devolver
 * `readConfig()` en crudo cada llamada dispararía re-renders infinitos.
 */
let cachedSnapshot: HyprConfig | null = null;

function getSnapshot(): HyprConfig {
  if (cachedSnapshot === null) cachedSnapshot = readConfig();
  return cachedSnapshot;
}

function getServerSnapshot(): HyprConfig {
  return HYPR_CONFIG_DEFAULTS;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    cachedSnapshot = null;
    onChange();
  };
  // Cambios desde otra pestaña (storage) o desde este mismo store.
  window.addEventListener("storage", handler);
  window.addEventListener(STORAGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(STORAGE_EVENT, handler);
  };
}

/** Persiste y notifica a los suscriptores intra-pestaña. */
function commit(cfg: HyprConfig): void {
  writeConfig(cfg);
  cachedSnapshot = cfg;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

export interface UseHyprConfigResult {
  config: HyprConfig;
  /** Aplica un parche parcial sobre la config actual. */
  setConfig: (patch: Partial<HyprConfig>) => void;
  /** Renombra un workspace (nombre vacío = vuelve a mostrar el número). */
  setWorkspaceName: (ws: number, name: string) => void;
  /** Restablece todos los valores a los defaults. */
  resetConfig: () => void;
}

/**
 * Hook reactivo (intra-pestaña) a la configuración del compositor.
 * Consumible desde cualquier componente cliente sin Provider.
 */
export function useHyprConfig(): UseHyprConfigResult {
  const config = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setConfig = useCallback((patch: Partial<HyprConfig>) => {
    const next: HyprConfig = { ...getSnapshot(), ...patch };
    if (patch.gapTiles !== undefined) next.gapTiles = clampGap(patch.gapTiles);
    if (patch.workspaceNames !== undefined) {
      next.workspaceNames = sanitizeNames(patch.workspaceNames);
    }
    commit(next);
  }, []);

  const setWorkspaceName = useCallback((ws: number, name: string) => {
    const current = getSnapshot();
    const names = { ...current.workspaceNames };
    if (name.trim()) names[ws] = name.trim();
    else delete names[ws];
    commit({ ...current, workspaceNames: names });
  }, []);

  const resetConfig = useCallback(() => {
    commit({ ...HYPR_CONFIG_DEFAULTS, workspaceNames: {} });
  }, []);

  return { config, setConfig, setWorkspaceName, resetConfig };
}

/**
 * Etiqueta corta de un workspace: su nombre configurado o el número.
 * Útil para pills de la waybar y acciones del launcher.
 */
export function workspaceLabel(
  ws: number,
  names: Record<number, string>,
): string {
  return names[ws]?.trim() || String(ws);
}
