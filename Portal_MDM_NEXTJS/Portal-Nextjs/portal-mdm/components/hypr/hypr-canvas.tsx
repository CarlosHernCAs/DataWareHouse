"use client";

import "dockview-react/dist/styles/dockview.css";

import {
  DockviewReact,
  themeAbyss,
  type DockviewApi,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
  type SerializedDockview,
} from "dockview-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { AppWindowPanel } from "./app-window-panel";
import { getHyprApp } from "@/lib/hypr/apps";
import {
  loadLayoutState,
  saveLayoutState,
  HYPR_WORKSPACES,
  type HyprLayoutState,
} from "@/lib/hypr/layout-store";

export type ResizeDir = "left" | "right" | "up" | "down";

/** Acciones imperativas que el shell (keymap, dock, launcher) dispara. */
export interface HyprCanvasHandle {
  openApp: (appId: string) => void;
  closeActivePanel: () => void;
  toggleFullscreenActive: () => void;
  toggleFloatActive: () => void;
  moveActiveToWorkspace: (n: number) => void;
  resizeActive: (dir: ResizeDir) => void;
}

interface HyprCanvasProps {
  /** Workspace activo (1..5) controlado por el shell. */
  activeWorkspace: number;
  /** Reporta qué workspaces tienen ventanas (para las pills de la waybar). */
  onOccupancyChange?: (occ: Record<number, boolean>) => void;
  /** Separación (px) entre tiles del mosaico (config del compositor). */
  gapTiles?: number;
}

/**
 * Un único componente `appWindow`: lee `params.appId` y monta la app admin
 * correspondiente. Definido a nivel de módulo para que su referencia sea
 * estable entre renders (dockview lo exige).
 */
const DOCKVIEW_COMPONENTS = {
  appWindow: (props: IDockviewPanelProps) => {
    const appId = String((props.params as { appId?: string }).appId ?? "");
    return <AppWindowPanel appId={appId} />;
  },
};

const DEFAULT_APP_WS1 = "dashboard";
const RESIZE_STEP = 60;
const MIN_SIZE = 120;

function safeToJSON(api: DockviewApi): SerializedDockview | undefined {
  try {
    return api.toJSON();
  } catch {
    return undefined;
  }
}

function layoutTienePaneles(layout: SerializedDockview | undefined): boolean {
  return !!layout && Object.keys(layout.panels ?? {}).length > 0;
}

/**
 * Canvas del compositor: un mosaico dockview que reutiliza UNA instancia para
 * todos los workspaces. Al cambiar de workspace guarda el layout actual y
 * restaura el del destino (persistido en localStorage). El workspace 1 arranca
 * con la ventana Dashboard abierta.
 *
 * Fase 2: expone acciones de gestor de ventanas (fullscreen, flotar, mover a
 * workspace, resize) y reporta ocupación por workspace.
 */
export const HyprCanvas = forwardRef<HyprCanvasHandle, HyprCanvasProps>(
  function HyprCanvas({ activeWorkspace, onOccupancyChange, gapTiles }, ref) {
    const apiRef = useRef<DockviewApi | null>(null);
    const layoutsRef = useRef<HyprLayoutState["layouts"]>({});
    const activeWsRef = useRef<number>(activeWorkspace);
    // Ventanas pendientes de abrir al entrar a un workspace (mover-a-workspace).
    const pendingByWsRef = useRef<Record<number, string[]>>({});
    // Evita que los cambios programáticos (fromJSON/clear) se re-persistan en
    // el workspace equivocado durante una conmutación.
    const suppressPersistRef = useRef(false);
    const onOccupancyRef = useRef(onOccupancyChange);
    onOccupancyRef.current = onOccupancyChange;

    const persist = useCallback(() => {
      saveLayoutState({
        active: activeWsRef.current,
        layouts: layoutsRef.current,
      });
    }, []);

    const reportarOcupacion = useCallback(() => {
      const api = apiRef.current;
      const occ: Record<number, boolean> = {};
      for (const ws of HYPR_WORKSPACES) {
        if (ws === activeWsRef.current) {
          occ[ws] = !!api && api.panels.length > 0;
        } else {
          occ[ws] =
            layoutTienePaneles(layoutsRef.current[ws]) ||
            (pendingByWsRef.current[ws]?.length ?? 0) > 0;
        }
      }
      onOccupancyRef.current?.(occ);
    }, []);

    const openApp = useCallback((appId: string) => {
      const api = apiRef.current;
      const app = getHyprApp(appId);
      if (!api || !app) return;
      const existing = api.getPanel(appId);
      if (existing) {
        existing.api.setActive();
        return;
      }
      // Si ya hay ventanas, abrir en MOSAICO dividido (a la derecha) en vez de
      // apilar como pestaña — así se siente como un tiling WM (Hyprland).
      const yaHayVentanas = api.panels.length > 0;
      api.addPanel({
        id: appId,
        component: "appWindow",
        params: { appId },
        title: app.title,
        ...(yaHayVentanas
          ? { position: { direction: "right" as const } }
          : {}),
      });
    }, []);

    const closeActivePanel = useCallback(() => {
      const api = apiRef.current;
      const panel = api?.activePanel;
      if (api && panel) api.removePanel(panel);
    }, []);

    const toggleFullscreenActive = useCallback(() => {
      const api = apiRef.current;
      const panel = api?.activePanel;
      if (!api || !panel) return;
      if (api.hasMaximizedGroup()) api.exitMaximizedGroup();
      else api.maximizeGroup(panel);
    }, []);

    const toggleFloatActive = useCallback(() => {
      const api = apiRef.current;
      const panel = api?.activePanel;
      if (!api || !panel) return;
      if (panel.api.location.type === "floating") {
        // Des-flotar: mover a un grupo del grid (o crear uno si no existe).
        const currentGroupId = panel.api.group.id;
        const target =
          api.groups.find((g) => g.id !== currentGroupId) ?? api.addGroup();
        panel.api.moveTo({ group: target });
      } else {
        api.addFloatingGroup(panel);
      }
    }, []);

    const resizeActive = useCallback((dir: ResizeDir) => {
      const api = apiRef.current;
      const panel = api?.activePanel;
      if (!api || !panel) return;
      const w = panel.api.width ?? 300;
      const h = panel.api.height ?? 200;
      switch (dir) {
        case "left":
          panel.api.setSize({ width: Math.max(MIN_SIZE, w - RESIZE_STEP) });
          break;
        case "right":
          panel.api.setSize({ width: w + RESIZE_STEP });
          break;
        case "up":
          panel.api.setSize({ height: Math.max(MIN_SIZE, h - RESIZE_STEP) });
          break;
        case "down":
          panel.api.setSize({ height: h + RESIZE_STEP });
          break;
      }
    }, []);

    const moveActiveToWorkspace = useCallback(
      (n: number) => {
        const api = apiRef.current;
        const panel = api?.activePanel;
        if (!api || !panel || n === activeWsRef.current) return;
        const appId = panel.id;
        api.removePanel(panel);
        (pendingByWsRef.current[n] ??= []).push(appId);
        reportarOcupacion();
      },
      [reportarOcupacion],
    );

    useImperativeHandle(
      ref,
      () => ({
        openApp,
        closeActivePanel,
        toggleFullscreenActive,
        toggleFloatActive,
        moveActiveToWorkspace,
        resizeActive,
      }),
      [
        openApp,
        closeActivePanel,
        toggleFullscreenActive,
        toggleFloatActive,
        moveActiveToWorkspace,
        resizeActive,
      ],
    );

    // Restaura un workspace: su layout persistido, o el default (Dashboard en
    // ws1), y abre las ventanas pendientes (movidas desde otro workspace).
    const loadWorkspace = useCallback(
      (ws: number) => {
        const api = apiRef.current;
        if (!api) return;
        suppressPersistRef.current = true;
        try {
          const layout = layoutsRef.current[ws];
          if (layout) {
            api.fromJSON(layout);
          } else {
            api.clear();
            if (ws === 1) openApp(DEFAULT_APP_WS1);
          }
          const pend = pendingByWsRef.current[ws];
          if (pend?.length) {
            pend.forEach((id) => openApp(id));
            pendingByWsRef.current[ws] = [];
          }
        } catch {
          api.clear();
        } finally {
          suppressPersistRef.current = false;
        }
      },
      [openApp],
    );

    const onReady = useCallback(
      (event: DockviewReadyEvent) => {
        const api = event.api;
        apiRef.current = api;

        const st = loadLayoutState();
        layoutsRef.current = st.layouts;
        activeWsRef.current = activeWorkspace;

        loadWorkspace(activeWorkspace);
        reportarOcupacion();

        // Persistir el layout del workspace activo ante cualquier cambio.
        api.onDidLayoutChange(() => {
          if (suppressPersistRef.current) return;
          layoutsRef.current[activeWsRef.current] = safeToJSON(api);
          persist();
        });
        // Ocupación en vivo del workspace activo.
        api.onDidAddPanel(() => reportarOcupacion());
        api.onDidRemovePanel(() => reportarOcupacion());
      },
      [activeWorkspace, loadWorkspace, persist, reportarOcupacion],
    );

    // Conmutación de workspace: guarda el actual, restaura el destino.
    useEffect(() => {
      const api = apiRef.current;
      if (!api) return; // el montaje inicial lo maneja onReady
      const prev = activeWsRef.current;
      if (prev === activeWorkspace) return;

      layoutsRef.current[prev] = safeToJSON(api);
      activeWsRef.current = activeWorkspace;
      loadWorkspace(activeWorkspace);
      persist();
      reportarOcupacion();
    }, [activeWorkspace, loadWorkspace, persist, reportarOcupacion]);

    return (
      <div className="h-full w-full">
        <DockviewReact
          components={DOCKVIEW_COMPONENTS}
          onReady={onReady}
          theme={
            gapTiles === undefined
              ? themeAbyss
              : { ...themeAbyss, gap: gapTiles }
          }
        />
      </div>
    );
  },
);
