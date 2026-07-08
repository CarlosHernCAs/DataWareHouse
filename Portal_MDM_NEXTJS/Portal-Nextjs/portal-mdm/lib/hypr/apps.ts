/**
 * lib/hypr/apps.ts
 * ================
 * Registro de "aplicaciones" del compositor Hypr (solo lado administrador).
 *
 * Cada entrada es un "programa" lanzable como VENTANA dentro del mosaico
 * (dockview). Reutiliza las client-shells de admin existentes que ya se
 * auto-alimentan por React Query — no reimplementa sus datos.
 *
 * Carga diferida (`lazy`): una ventana solo descarga su bundle cuando se
 * abre. Shells pesadas (Plotly, TanStack Table) no penalizan el arranque
 * del compositor.
 *
 * NOTA: `quality` se añade en la fase siguiente junto con su wrapper cliente
 * (`components/hypr/quality-window.tsx`), porque es la única shell que hoy
 * recibe datos iniciales desde su server component.
 */

import {
  Bell,
  Database,
  LayoutDashboard,
  Network,
  Settings,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export type HyprAppId =
  | "dashboard"
  | "etl-control"
  | "dwh"
  | "quality"
  | "alerts"
  | "catalogos"
  | "configuracion";

export interface HyprApp {
  id: HyprAppId;
  /** Título mostrado en la pestaña/tab de la ventana. */
  title: string;
  icon: LucideIcon;
  /** Componente cliente montado como cuerpo de la ventana (lazy). */
  Component: LazyExoticComponent<ComponentType<Record<string, never>>>;
}

/**
 * Helper: envuelve un import de export NOMBRADO en el shape `{ default }`
 * que `lazy` exige, descartando props (las shells se auto-alimentan).
 */
function lazyNamed<T extends string>(
  loader: () => Promise<Record<T, ComponentType<never>>>,
  name: T,
): LazyExoticComponent<ComponentType<Record<string, never>>> {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[name] as ComponentType<Record<string, never>> };
  });
}

export const HYPR_APPS: Record<HyprAppId, HyprApp> = {
  dashboard: {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    Component: lazyNamed(
      () => import("@/components/control-center/dashboard"),
      "Dashboard",
    ),
  },
  "etl-control": {
    id: "etl-control",
    title: "Control ETL",
    icon: Workflow,
    Component: lazyNamed(
      () => import("@/app/(admin)/etl-control/etl-control-client"),
      "EtlControlClient",
    ),
  },
  dwh: {
    id: "dwh",
    title: "DWH Explorer",
    icon: Network,
    Component: lazyNamed(
      () => import("@/app/(admin)/dwh/dwh-client"),
      "DwhExplorerClient",
    ),
  },
  quality: {
    id: "quality",
    title: "Calidad",
    icon: ShieldCheck,
    Component: lazyNamed(
      () => import("@/components/hypr/quality-window"),
      "QualityWindow",
    ),
  },
  alerts: {
    id: "alerts",
    title: "Alertas",
    icon: Bell,
    Component: lazyNamed(
      () => import("@/app/(admin)/alerts/alerts-client"),
      "AlertsClient",
    ),
  },
  catalogos: {
    id: "catalogos",
    title: "Catálogos",
    icon: Database,
    Component: lazyNamed(
      () => import("@/app/(admin)/catalogos/catalogos-client"),
      "CatalogosClient",
    ),
  },
  configuracion: {
    id: "configuracion",
    title: "Configuración",
    icon: Settings,
    Component: lazyNamed(
      () => import("@/app/(admin)/configuracion/configuracion-client"),
      "ConfiguracionClient",
    ),
  },
};

/** Lista ordenada para el launcher / dock. */
export const HYPR_APP_LIST: readonly HyprApp[] = Object.values(HYPR_APPS);

export function getHyprApp(id: string): HyprApp | undefined {
  return (HYPR_APPS as Record<string, HyprApp>)[id];
}
