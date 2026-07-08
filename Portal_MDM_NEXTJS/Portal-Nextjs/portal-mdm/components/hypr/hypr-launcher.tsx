"use client";

import { Command } from "cmdk";
import { LogOut, PanelsTopLeft, SquareX } from "lucide-react";
import { HYPR_APP_LIST } from "@/lib/hypr/apps";
import { HYPR_WORKSPACES } from "@/lib/hypr/layout-store";

interface HyprLauncherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenApp: (appId: string) => void;
  onSwitchWorkspace: (n: number) => void;
  onCloseActive: () => void;
  onExitHypr: () => void;
}

/**
 * Lanzador del compositor (equivalente a rofi/wofi en Hyprland). A diferencia
 * del `CommandPalette` global —que navega RUTAS— este abre apps como VENTANAS
 * en el mosaico y expone acciones del gestor de ventanas.
 */
export function HyprLauncher({
  open,
  onOpenChange,
  onOpenApp,
  onSwitchWorkspace,
  onCloseActive,
  onExitHypr,
}: HyprLauncherProps) {
  if (!open) return null;

  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lanzador de aplicaciones"
      className="fixed inset-0 z-[100]"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div className="fixed left-1/2 top-[18vh] w-[92vw] max-w-lg -translate-x-1/2">
        <Command
          loop
          className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        >
          <Command.Input
            autoFocus
            placeholder="Abrir aplicación, workspace o acción…"
            className="w-full border-b border-[var(--color-border)] bg-transparent px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
              Sin resultados.
            </Command.Empty>

            <Command.Group
              heading="Aplicaciones"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[var(--color-text-muted)]"
            >
              {HYPR_APP_LIST.map((app) => {
                const Icon = app.icon;
                return (
                  <Command.Item
                    key={app.id}
                    value={`app ${app.title}`}
                    onSelect={() => run(() => onOpenApp(app.id))}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-text)] data-[selected=true]:bg-[var(--color-surface-2)] aria-selected:bg-[var(--color-surface-2)]"
                  >
                    <Icon aria-hidden className="h-4 w-4 shrink-0" />
                    {app.title}
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Group
              heading="Workspaces"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[var(--color-text-muted)]"
            >
              {HYPR_WORKSPACES.map((n) => (
                <Command.Item
                  key={n}
                  value={`workspace ${n}`}
                  onSelect={() => run(() => onSwitchWorkspace(n))}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-text)] data-[selected=true]:bg-[var(--color-surface-2)] aria-selected:bg-[var(--color-surface-2)]"
                >
                  <span className="flex h-4 w-4 items-center justify-center text-xs tabular">
                    {n}
                  </span>
                  Ir al workspace {n}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading="Ventana / Sesión"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[var(--color-text-muted)]"
            >
              <Command.Item
                value="cerrar ventana activa"
                onSelect={() => run(onCloseActive)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-text)] data-[selected=true]:bg-[var(--color-surface-2)] aria-selected:bg-[var(--color-surface-2)]"
              >
                <SquareX aria-hidden className="h-4 w-4 shrink-0" />
                Cerrar ventana activa
              </Command.Item>
              <Command.Item
                value="vista clasica sidebar"
                onSelect={() => run(onExitHypr)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-text)] data-[selected=true]:bg-[var(--color-surface-2)] aria-selected:bg-[var(--color-surface-2)]"
              >
                <PanelsTopLeft aria-hidden className="h-4 w-4 shrink-0" />
                Cambiar a vista clásica
              </Command.Item>
              <Command.Item
                value="cerrar sesion logout"
                onSelect={() =>
                  run(() => {
                    const form = document.createElement("form");
                    form.method = "POST";
                    form.action = "/api/auth/logout";
                    document.body.appendChild(form);
                    form.submit();
                  })
                }
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-destructive)] data-[selected=true]:bg-[var(--color-surface-2)] aria-selected:bg-[var(--color-surface-2)]"
              >
                <LogOut aria-hidden className="h-4 w-4 shrink-0" />
                Cerrar sesión
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] px-3 py-2 text-[10px] text-[var(--color-text-muted)]">
            <span>↑↓ navegar</span>
            <span>↵ seleccionar</span>
            <span>esc cerrar</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
