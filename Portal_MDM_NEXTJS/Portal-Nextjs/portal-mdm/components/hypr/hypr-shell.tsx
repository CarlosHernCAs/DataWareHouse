"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth/rbac";
import { SessionExpiredHandler } from "@/components/providers/session-expired-handler";
import { AlertStreamMount } from "@/components/providers/alert-stream-mount";
import { CommandPalette } from "@/components/ui/command-palette";
import { HYPR_APP_LIST } from "@/lib/hypr/apps";
import { Waybar } from "./waybar";

const WORKSPACES = [1, 2, 3, 4, 5] as const;

interface HyprShellProps {
  role: Role;
  userName?: string;
  /** Volver al shell clásico (persiste la preferencia). */
  onExitHypr: () => void;
}

/**
 * Compositor estilo Hyprland para el administrador.
 *
 * Fase 0 (scaffold): waybar viva + workspaces conmutables + lanzador (⌘K) +
 * dock de aplicaciones. El montaje real de ventanas en mosaico (dockview)
 * llega en la Fase 1; aquí el canvas muestra el estado vacío del workspace.
 *
 * Reutiliza los mounts globales que hoy viven en `RoleShell`
 * (`SessionExpiredHandler`, `AlertStreamMount`, `CommandPalette`) para no
 * perder sesión-expirada, stream de alertas ni el command palette.
 */
export function HyprShell({ role, userName, onExitHypr }: HyprShellProps) {
  const [activeWorkspace, setActiveWorkspace] = useState<number>(1);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Keymap global. Sigue la disciplina de `use-dwh-keyboard-nav.ts`: ignora
  // teclas cuando el foco está en un campo editable y evita robar combos del SO.
  useEffect(() => {
    function esEditable(el: EventTarget | null): boolean {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        node.isContentEditable
      );
    }

    function onKey(e: KeyboardEvent) {
      // ⌘K / Ctrl+K — alternar lanzador (permitido incluso en inputs).
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        return;
      }
      if (esEditable(e.target)) return;
      // Alt+1..5 — cambiar de workspace (leader = Alt, seguro en navegador).
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const n = Number(e.key);
        if (Number.isInteger(n) && n >= 1 && n <= WORKSPACES.length) {
          e.preventDefault();
          setActiveWorkspace(n);
        }
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const abrirLauncher = useCallback(() => setPaletteOpen(true), []);

  return (
    <div className="bg-bg text-text flex h-screen flex-col overflow-hidden">
      <SessionExpiredHandler />
      <AlertStreamMount />

      <Waybar
        role={role}
        userName={userName}
        workspaces={WORKSPACES}
        activeWorkspace={activeWorkspace}
        onSwitchWorkspace={setActiveWorkspace}
        onOpenLauncher={abrirLauncher}
        onExitHypr={onExitHypr}
      />

      {/* Canvas del workspace activo. Fase 1 lo reemplaza por el mosaico dockview. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="hypr-anim-ws-in relative flex flex-1 flex-col items-center justify-center gap-6 p-[var(--gap-tile-lg)]"
        aria-label={`Workspace ${activeWorkspace}`}
      >
        <div className="text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            Workspace {activeWorkspace} · vacío
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Abre una aplicación con{" "}
            <kbd className="rounded border border-[var(--color-border)] px-1">
              ⌘K
            </kbd>{" "}
            o desde el dock inferior.
          </p>
        </div>
      </main>

      {/* Dock de aplicaciones (estilo dock de Hyprland). En Fase 0 abre el
          lanzador; en Fase 1 abrirá cada app como ventana en el mosaico. */}
      <nav
        className="hypr-blur flex shrink-0 items-center justify-center gap-1 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_82%,transparent)] p-1.5"
        aria-label="Dock de aplicaciones"
      >
        {HYPR_APP_LIST.map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              type="button"
              onClick={abrirLauncher}
              title={app.title}
              aria-label={`Abrir ${app.title}`}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md px-3 text-xs text-[var(--color-text-muted)] transition",
                "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
              )}
            >
              <Icon aria-hidden className="h-4 w-4" />
              <span className="hidden lg:inline">{app.title}</span>
            </button>
          );
        })}
      </nav>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} role={role} />
    </div>
  );
}
