"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth/rbac";
import { SessionExpiredHandler } from "@/components/providers/session-expired-handler";
import { AlertStreamMount } from "@/components/providers/alert-stream-mount";
import { HYPR_APP_LIST } from "@/lib/hypr/apps";
import { HYPR_WORKSPACES, loadLayoutState } from "@/lib/hypr/layout-store";
import { Waybar } from "./waybar";
import { HyprCanvas, type HyprCanvasHandle } from "./hypr-canvas";
import { HyprLauncher } from "./hypr-launcher";

interface HyprShellProps {
  role: Role;
  userName?: string;
  /** Volver al shell clásico (persiste la preferencia). */
  onExitHypr: () => void;
}

/**
 * Compositor estilo Hyprland para el administrador (Fase 1).
 *
 * Un mosaico dockview donde las apps admin son ventanas, con workspaces
 * conmutables (Alt+1..5, layout persistido en localStorage), lanzador (⌘K) y
 * waybar viva. Reutiliza los mounts globales de `RoleShell`
 * (`SessionExpiredHandler`, `AlertStreamMount`).
 */
export function HyprShell({ role, userName, onExitHypr }: HyprShellProps) {
  // Arranca en el workspace persistido (o el 1). Cliente-only: este shell
  // nunca se renderiza en SSR (el switcher lo gatea a desktop tras montar).
  const [activeWorkspace, setActiveWorkspace] = useState<number>(
    () => loadLayoutState().active,
  );
  const [launcherOpen, setLauncherOpen] = useState(false);
  const canvasRef = useRef<HyprCanvasHandle>(null);

  const openApp = useCallback((appId: string) => {
    canvasRef.current?.openApp(appId);
  }, []);
  const closeActive = useCallback(() => {
    canvasRef.current?.closeActivePanel();
  }, []);

  // Keymap global. Disciplina de `use-dwh-keyboard-nav.ts`: ignora teclas en
  // campos editables y no roba combos del SO.
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
        setLauncherOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        setLauncherOpen(false);
        return;
      }
      if (esEditable(e.target)) return;
      // Leader = Alt (seguro en navegador).
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const n = Number(e.key);
        if (Number.isInteger(n) && n >= 1 && n <= HYPR_WORKSPACES.length) {
          e.preventDefault();
          setActiveWorkspace(n);
          return;
        }
        // Alt+D — lanzador (convención Hyprland).
        if (e.key.toLowerCase() === "d") {
          e.preventDefault();
          setLauncherOpen(true);
          return;
        }
        // Alt+Q — cerrar ventana activa.
        if (e.key.toLowerCase() === "q") {
          e.preventDefault();
          closeActive();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeActive]);

  return (
    <div className="bg-bg text-text flex h-screen flex-col overflow-hidden">
      <SessionExpiredHandler />
      <AlertStreamMount />

      <Waybar
        role={role}
        userName={userName}
        workspaces={HYPR_WORKSPACES}
        activeWorkspace={activeWorkspace}
        onSwitchWorkspace={setActiveWorkspace}
        onOpenLauncher={() => setLauncherOpen(true)}
        onExitHypr={onExitHypr}
      />

      {/* Canvas del workspace activo — mosaico dockview. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="hypr-anim-ws-in relative min-h-0 flex-1"
        aria-label={`Workspace ${activeWorkspace}`}
      >
        <HyprCanvas ref={canvasRef} activeWorkspace={activeWorkspace} />
      </main>

      {/* Dock de aplicaciones — abre cada app como ventana en el mosaico. */}
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
              onClick={() => openApp(app.id)}
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

      <HyprLauncher
        open={launcherOpen}
        onOpenChange={setLauncherOpen}
        onOpenApp={openApp}
        onSwitchWorkspace={setActiveWorkspace}
        onCloseActive={closeActive}
        onExitHypr={onExitHypr}
      />
    </div>
  );
}
