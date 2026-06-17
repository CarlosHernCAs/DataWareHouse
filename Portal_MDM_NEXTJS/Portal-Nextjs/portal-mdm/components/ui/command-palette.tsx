"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Command } from "cmdk";
import {
  Compass,
  Database,
  FileText,
  FlaskConical,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  Network,
  PlayCircle,
  RefreshCw,
  Rows2,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Telescope,
  Trash2,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isRoleAllowed, type Role } from "@/lib/auth/rbac";
import { usePreferencias } from "@/components/providers/preferencias-provider";
import { useToast } from "@/hooks/use-toast";

/* ----------------------------------------------------------------- data */

interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  action?: () => void;
  group: string;
  keywords?: string;
}

interface BuildItemsCtx {
  router: ReturnType<typeof useRouter>;
  densidad: "compacta" | "comoda";
  setDensidad: (d: "compacta" | "comoda") => void;
  tema: "oscuro" | "sistema";
  setTema: (t: "oscuro" | "sistema") => void;
  clearCache: () => void;
  logout: () => void;
}

function buildItems(ctx: BuildItemsCtx): PaletteItem[] {
  const { router, densidad, setDensidad, tema, setTema, clearCache, logout } = ctx;
  return [
    // ── Operaciones ────────────────────────────────────────────────
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Vista operativa del ecosistema de datos",
      icon: LayoutDashboard,
      href: "/dashboard",
      group: "Operaciones",
      keywords: "estado salud kpis",
    },
    {
      id: "etl-monitor",
      label: "Monitor ETL",
      description: "Corridas activas e historial",
      icon: Workflow,
      href: "/etl-monitor",
      group: "Operaciones",
      keywords: "corridas pipeline etl runs",
    },
    {
      id: "etl-launch",
      label: "Lanzar ETL",
      description: "Iniciar una nueva corrida",
      icon: PlayCircle,
      href: "/etl-monitor/lanzar",
      group: "Acciones rápidas",
      keywords: "run launch start ejecutar",
    },
    {
      id: "alerts",
      label: "Alertas",
      description: "Eventos accionables del portal y backend",
      icon: ShieldAlert,
      href: "/alerts",
      group: "Operaciones",
      keywords: "alertas notificaciones critico warning",
    },
    {
      id: "quality",
      label: "Calidad de datos",
      description: "Cuarentena, KPIs y rechazos",
      icon: ShieldCheck,
      href: "/quality",
      group: "Operaciones",
      keywords: "cuarentena quality rechazos mdm",
    },
    {
      id: "dwh",
      label: "DWH Explorer",
      description: "Catálogo de tablas, columnas y lineage",
      icon: Network,
      href: "/dwh",
      group: "Operaciones",
      keywords: "tablas columnas lineage explorer",
    },
    // Workflows fue migrado a /quality; el ítem queda como alias para que
    // la memoria muscular del usuario siga funcionando.
    {
      id: "workflows",
      label: "Homologación",
      description: "Workflows MDM dentro de Calidad",
      icon: Workflow,
      href: "/quality",
      group: "Operaciones",
      keywords: "homologacion workflows mdm reinyeccion",
    },
    // ── Gobierno ───────────────────────────────────────────────────
    {
      id: "bitacora",
      label: "Bitácora",
      description: "Historial de cargas y auditoría",
      icon: History,
      href: "/bitacora",
      group: "Gobierno",
      keywords: "auditoria log historial cargas",
    },
    {
      id: "catalogos",
      label: "Catálogos",
      description: "Variedades, geografía y personal",
      icon: Database,
      href: "/catalogos",
      group: "Gobierno",
      keywords: "variedades geografia personal maestros",
    },
    {
      id: "configuracion",
      label: "Configuración",
      description: "Usuarios, parámetros y reglas",
      icon: Settings,
      href: "/configuracion",
      group: "Gobierno",
      keywords: "config usuarios parametros reglas",
    },
    // ── Análisis ───────────────────────────────────────────────────
    {
      id: "explore",
      label: "Exploración",
      description: "Consultas ad-hoc sobre el DWH",
      icon: Compass,
      href: "/explore",
      group: "Análisis",
      keywords: "explorar datos consultas adhoc",
    },
    {
      id: "models",
      label: "Modelos",
      description: "Modelos analíticos registrados",
      icon: FlaskConical,
      href: "/models",
      group: "Análisis",
      keywords: "modelos ml analytics",
    },
    {
      id: "reports",
      label: "Reportes",
      description: "Informes con parámetros de fecha",
      icon: FileText,
      href: "/reports",
      group: "Análisis",
      keywords: "reportes informes pdf excel",
    },
    // ── Executive ──────────────────────────────────────────────────
    {
      id: "overview",
      label: "Visión ejecutiva",
      description: "Indicadores agregados para decisión",
      icon: Telescope,
      href: "/overview",
      group: "Gobierno",
      keywords: "ejecutivo overview kpis gerencia",
    },
    // ── Acciones rápidas ───────────────────────────────────────────
    {
      id: "reload",
      label: "Recargar página",
      icon: RefreshCw,
      action: () => router.refresh(),
      group: "Acciones rápidas",
      keywords: "reload refresh recargar",
    },
    {
      id: "clear-cache",
      label: "Limpiar cache de queries",
      description: "Fuerza un refetch de todos los datos en pantalla",
      icon: Trash2,
      action: clearCache,
      group: "Acciones rápidas",
      keywords: "cache invalidate refetch limpiar",
    },
    // ── Preferencias ──────────────────────────────────────────────
    {
      id: "toggle-density",
      label: densidad === "compacta" ? "Densidad: cómoda" : "Densidad: compacta",
      description: "Cambia el alto de filas en tablas",
      icon: Rows2,
      action: () => setDensidad(densidad === "compacta" ? "comoda" : "compacta"),
      group: "Preferencias",
      keywords: "density compact comfortable filas",
    },
    {
      id: "toggle-theme",
      label: tema === "oscuro" ? "Tema: usar sistema" : "Tema: forzar oscuro",
      description: "Sincroniza con prefers-color-scheme o fija dark",
      icon: Moon,
      action: () => setTema(tema === "oscuro" ? "sistema" : "oscuro"),
      group: "Preferencias",
      keywords: "theme dark light tema",
    },
    // ── Sesión ────────────────────────────────────────────────────
    {
      id: "logout",
      label: "Cerrar sesión",
      icon: LogOut,
      action: logout,
      group: "Sesión",
      keywords: "logout salir cerrar sesion exit",
    },
  ];
}

/* --------------------------------------------------------------- component */

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Filtra los destinos a los que el rol actual tiene acceso. */
  role: Role;
}

export function CommandPalette({ open, onOpenChange, role }: CommandPaletteProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { densidad, setDensidad, tema, setTema } = usePreferencias();

  function clearCache() {
    qc.clear();
    toast({ title: "Cache de queries limpiada", variant: "success" });
  }

  function logout() {
    // Mismo patrón que el dropdown del sidebar: POST form al endpoint
    // de logout para que limpie la cookie httpOnly del JWT.
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/api/auth/logout";
    document.body.appendChild(form);
    form.submit();
  }

  // Solo mostramos rutas permitidas para el rol (acciones sin href siempre).
  const items = buildItems({
    router,
    densidad,
    setDensidad,
    tema,
    setTema,
    clearCache,
    logout,
  }).filter((it) => !it.href || isRoleAllowed(role, it.href));

  // Group items by group key preserving insertion order
  const groups: Record<string, PaletteItem[]> = {};
  for (const item of items) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }

  function select(item: PaletteItem) {
    onOpenChange(false);
    if (item.href) router.push(item.href);
    else item.action?.();
  }

  // Montar solo al abrir: evita que `Command.Input autoFocus` robe el foco
  // en cada carga de página y mantiene el árbol liviano cuando está cerrada.
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
      className={cn(
        "fixed inset-0 z-[100]",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150",
          open ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed left-1/2 top-[20vh] w-full max-w-lg -translate-x-1/2 transition-[opacity,transform] duration-150",
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none",
        )}
      >
        <Command
          className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
          label="Paleta de comandos"
          loop
        >
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="shrink-0 text-[var(--color-text-muted)]"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <Command.Input
              autoFocus
              placeholder="Buscar páginas y acciones…"
              className="flex-1 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
            <kbd className="hidden rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)] sm:inline-block">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              Sin resultados.
            </Command.Empty>

            {Object.entries(groups).map(([group, groupItems]) => (
              <Command.Group
                key={group}
                heading={group}
                className={cn(
                  "[&_[cmdk-group-heading]]:px-2",
                  "[&_[cmdk-group-heading]]:py-1.5",
                  "[&_[cmdk-group-heading]]:text-[10px]",
                  "[&_[cmdk-group-heading]]:font-semibold",
                  "[&_[cmdk-group-heading]]:uppercase",
                  "[&_[cmdk-group-heading]]:tracking-wide",
                  "[&_[cmdk-group-heading]]:text-[var(--color-text-muted)]",
                )}
              >
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${item.description ?? ""} ${item.keywords ?? ""}`}
                      onSelect={() => select(item)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm",
                        "text-[var(--color-text-muted)]",
                        "transition-colors",
                        "data-[selected=true]:bg-[var(--color-surface-2)]",
                        "data-[selected=true]:text-[var(--color-text)]",
                        "aria-selected:bg-[var(--color-surface-2)]",
                        "aria-selected:text-[var(--color-text)]",
                      )}
                    >
                      <Icon
                        aria-hidden
                        className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]"
                      />
                      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                        <span className="truncate font-medium">{item.label}</span>
                        {item.description ? (
                          <span className="truncate text-[11px] text-[var(--color-text-muted)]">
                            {item.description}
                          </span>
                        ) : null}
                      </div>
                      {item.href ? (
                        <span className="shrink-0 font-mono text-[10px] text-[var(--color-text-muted)]">
                          {item.href}
                        </span>
                      ) : null}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2 text-[10px] text-[var(--color-text-muted)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[var(--color-border)] px-1 py-0.5">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[var(--color-border)] px-1 py-0.5">↵</kbd>
                seleccionar
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--color-border)] px-1 py-0.5">Ctrl K</kbd>
              alternar
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

/* La apertura (⌘K / Ctrl-K) y el trigger visible viven en RoleShell, que es
   quien conoce el rol para filtrar destinos y aloja el top bar. */
