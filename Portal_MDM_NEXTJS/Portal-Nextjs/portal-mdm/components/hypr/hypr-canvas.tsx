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
  type HyprLayoutState,
} from "@/lib/hypr/layout-store";

/** Acciones imperativas que el shell (keymap, dock, launcher) dispara. */
export interface HyprCanvasHandle {
  openApp: (appId: string) => void;
  closeActivePanel: () => void;
}

interface HyprCanvasProps {
  /** Workspace activo (1..5) controlado por el shell. */
  activeWorkspace: number;
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

function safeToJSON(api: DockviewApi): SerializedDockview | undefined {
  try {
    return api.toJSON();
  } catch {
    return undefined;
  }
}

/**
 * Canvas del compositor: un mosaico dockview que reutiliza UNA instancia para
 * todos los workspaces. Al cambiar de workspace guarda el layout actual y
 * restaura el del destino (persistido en localStorage). El workspace 1 arranca
 * con la ventana Dashboard abierta.
 */
export const HyprCanvas = forwardRef<HyprCanvasHandle, HyprCanvasProps>(
  function HyprCanvas({ activeWorkspace }, ref) {
    const apiRef = useRef<DockviewApi | null>(null);
    const layoutsRef = useRef<HyprLayoutState["layouts"]>({});
    const activeWsRef = useRef<number>(activeWorkspace);
    // Evita que los cambios programáticos (fromJSON/clear) se re-persistan en
    // el workspace equivocado durante una conmutación.
    const suppressPersistRef = useRef(false);

    const persist = useCallback(() => {
      saveLayoutState({
        active: activeWsRef.current,
        layouts: layoutsRef.current,
      });
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
      api.addPanel({
        id: appId,
        component: "appWindow",
        params: { appId },
        title: app.title,
      });
    }, []);

    const closeActivePanel = useCallback(() => {
      const api = apiRef.current;
      const panel = api?.activePanel;
      if (api && panel) api.removePanel(panel);
    }, []);

    useImperativeHandle(ref, () => ({ openApp, closeActivePanel }), [
      openApp,
      closeActivePanel,
    ]);

    // Restaura un workspace: su layout persistido, o el default (Dashboard en ws1).
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

        // Persistir el layout del workspace activo ante cualquier cambio.
        api.onDidLayoutChange(() => {
          if (suppressPersistRef.current) return;
          layoutsRef.current[activeWsRef.current] = safeToJSON(api);
          persist();
        });
      },
      [activeWorkspace, loadWorkspace, persist],
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
    }, [activeWorkspace, loadWorkspace, persist]);

    return (
      <div className="h-full w-full">
        <DockviewReact
          components={DOCKVIEW_COMPONENTS}
          onReady={onReady}
          theme={themeAbyss}
        />
      </div>
    );
  },
);
