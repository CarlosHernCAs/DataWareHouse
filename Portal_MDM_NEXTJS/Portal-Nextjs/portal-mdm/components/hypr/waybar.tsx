"use client";

import { Command, PanelsTopLeft, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth/rbac";
import { useSSEStatus } from "@/hooks/use-alert-stream";
import { useTickingNow } from "@/hooks/use-ticking-now";

const ROLE_LABELS: Record<Role, string> = {
  analyst: "Analista",
  admin: "Administrador MDM",
  executive: "Ejecutivo",
};

interface WaybarProps {
  role: Role;
  userName?: string;
  workspaces: readonly number[];
  activeWorkspace: number;
  onSwitchWorkspace: (n: number) => void;
  onOpenLauncher: () => void;
  onExitHypr: () => void;
}

/**
 * Barra de estado del compositor Hypr — equivalente a "waybar" en Hyprland.
 * Muestra workspaces (izquierda) y módulos vivos + sesión (derecha).
 *
 * Fase 0: pills de workspace conmutables, reloj y estado de conexión SSE
 * reales; módulos ETL/alertas en vivo llegan en la fase siguiente.
 */
export function Waybar({
  role,
  userName,
  workspaces,
  activeWorkspace,
  onSwitchWorkspace,
  onOpenLauncher,
  onExitHypr,
}: WaybarProps) {
  const sse = useSSEStatus();
  const now = useTickingNow(1000);
  const reloj = new Date(now).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header
      className="hypr-blur flex h-10 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_82%,transparent)] px-2 text-sm"
      aria-label="Barra de estado del compositor"
    >
      {/* Izquierda — workspaces */}
      <nav className="flex items-center gap-1" aria-label="Workspaces">
        {workspaces.map((n) => {
          const activo = n === activeWorkspace;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSwitchWorkspace(n)}
              aria-current={activo ? "true" : undefined}
              aria-label={`Ir al workspace ${n} (Alt+${n})`}
              className={cn(
                "flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-xs font-medium tabular transition",
                activo
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
              )}
            >
              {n}
            </button>
          );
        })}
      </nav>

      {/* Centro — launcher */}
      <button
        type="button"
        onClick={onOpenLauncher}
        className="flex items-center gap-2 rounded-md px-3 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        aria-label="Abrir lanzador de aplicaciones (Ctrl o Cmd + K)"
      >
        <Command aria-hidden className="h-3.5 w-3.5" />
        <span>Lanzar aplicación</span>
        <kbd className="rounded border border-[var(--color-border)] px-1 text-[10px]">
          ⌘K
        </kbd>
      </button>

      {/* Derecha — módulos + sesión */}
      <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
        {/* Estado de conexión en vivo (SSE) */}
        <span
          className="flex items-center gap-1"
          title={`Conexión en vivo: ${sse}`}
          aria-label={`Conexión en vivo: ${sse}`}
        >
          {sse === "connected" ? (
            <Wifi aria-hidden className="h-3.5 w-3.5 text-[var(--color-success)]" />
          ) : (
            <WifiOff
              aria-hidden
              className={cn(
                "h-3.5 w-3.5",
                sse === "reconnecting"
                  ? "text-[var(--color-warning)]"
                  : "text-[var(--color-text-muted)]",
              )}
            />
          )}
        </span>

        <span className="tabular" aria-label="Hora">
          {reloj}
        </span>

        <span className="hidden items-center gap-1.5 sm:flex">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-semibold text-[var(--color-primary-foreground)]">
            {(userName ?? "?").trim().charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[10rem] truncate text-[var(--color-text)]">
            {userName ?? "Sesión"}
          </span>
          <span className="text-[var(--color-text-muted)]">·</span>
          <span>{ROLE_LABELS[role]}</span>
        </span>

        {/* Salir del compositor → shell clásico */}
        <button
          type="button"
          onClick={onExitHypr}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          aria-label="Cambiar a la vista clásica (sidebar)"
          title="Vista clásica"
        >
          <PanelsTopLeft aria-hidden className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Vista clásica</span>
        </button>
      </div>
    </header>
  );
}
