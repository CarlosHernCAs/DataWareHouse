"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth/rbac";
import { SessionExpiredHandler } from "@/components/providers/session-expired-handler";
import { AlertStreamMount } from "@/components/providers/alert-stream-mount";
import { HYPR_APP_LIST } from "@/lib/hypr/apps";
import { HYPR_WORKSPACES, loadLayoutState } from "@/lib/hypr/layout-store";
import { useHyprConfig } from "@/lib/hypr/config-store";
import { Waybar } from "./waybar";
import { HyprCanvas, type HyprCanvasHandle, type ResizeDir } from "./hypr-canvas";
import { HyprLauncher } from "./hypr-launcher";
import { HyprKeymapHelp } from "./hypr-keymap-help";
import { HyprSettings } from "./hypr-settings";

interface HyprShellProps {
  role: Role;
  userName?: string;
  /** Volver al shell clásico (persiste la preferencia). */
  onExitHypr: () => void;
}

const RESIZE_KEYS: Record<string, ResizeDir> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

/**
 * Compositor estilo Hyprland para el administrador (Fase 2 + 3).
 *
 * Mosaico dockview con workspaces, launcher, gestos completos de gestor de
 * ventanas por teclado (mover a workspace Alt+Shift+N, fullscreen Alt+F,
 * flotar Alt+Shift+F, resize Alt+Ctrl+flechas, hoja de atajos ?) y panel de
 * configuración (Alt+,).
 */
export function HyprShell({ role, userName, onExitHypr }: HyprShellProps) {
  const [activeWorkspace, setActiveWorkspace] = useState<number>(
    () => loadLayoutState().active,
  );
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [occupancy, setOccupancy] = useState<Record<number, boolean>>({});
  const canvasRef = useRef<HyprCanvasHandle>(null);
  const { config } = useHyprConfig();

  const openApp = useCallback((appId: string) => {
    canvasRef.current?.openApp(appId);
  }, []);
  const closeActive = useCallback(() => {
    canvasRef.current?.closeActivePanel();
  }, []);
  const toggleFullscreen = useCallback(() => {
    canvasRef.current?.toggleFullscreenActive();
  }, []);
  const toggleFloat = useCallback(() => {
    canvasRef.current?.toggleFloatActive();
  }, []);
  const moveActiveTo = useCallback((n: number) => {
    canvasRef.current?.moveActiveToWorkspace(n);
  }, []);
  const resizeActive = useCallback((dir: ResizeDir) => {
    canvasRef.current?.resizeActive(dir);
  }, []);

  // Keymap global. Disciplina de `use-dwh-keyboard-nav.ts`: ignora teclas en
  // campos editables y no roba combos del SO. Usa `e.code` para los dígitos
  // (robusto: con Shift, "1" pasa a "!" en el layout US, pero code sigue Digit1).
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
        setHelpOpen(false);
        setSettingsOpen(false);
        return;
      }

      // Alt+, — panel de configuración del compositor. Antes del guard de
      // editables porque no colisiona con escritura y usa `e.code` estable.
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === "Comma") {
        e.preventDefault();
        setSettingsOpen((o) => !o);
        return;
      }

      if (esEditable(e.target)) return;

      // ? — hoja de atajos.
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((o) => !o);
        return;
      }

      // Alt+Ctrl+flechas — resize de la ventana activa.
      if (e.altKey && e.ctrlKey && !e.metaKey) {
        const dir = RESIZE_KEYS[e.code];
        if (dir) {
          e.preventDefault();
          resizeActive(dir);
        }
        return;
      }

      // Leader = Alt (sin Ctrl/Meta).
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const digit = /^Digit([1-9])$/.exec(e.code);
        if (digit) {
          const n = Number(digit[1]);
          if (n >= 1 && n <= HYPR_WORKSPACES.length) {
            e.preventDefault();
            if (e.shiftKey) moveActiveTo(n);
            else setActiveWorkspace(n);
          }
          return;
        }
        if (e.shiftKey) {
          if (e.code === "KeyF") {
            e.preventDefault();
            toggleFloat();
          }
          return;
        }
        // Alt (sin Shift)
        switch (e.code) {
          case "KeyD":
            e.preventDefault();
            setLauncherOpen(true);
            break;
          case "KeyF":
            e.preventDefault();
            toggleFullscreen();
            break;
          case "KeyQ":
            e.preventDefault();
            closeActive();
            break;
        }
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeActive, moveActiveTo, resizeActive, toggleFloat, toggleFullscreen]);

  // Config → CSS vars locales al compositor (no tocan el resto del portal):
  // - blur OFF ⇒ `--blur-md: 0px` neutraliza el `backdrop-filter` de `.hypr-blur`.
  // - animaciones OFF ⇒ duraciones de motion a 0ms (sin romper el bloque global
  //   de `prefers-reduced-motion`, que sigue aplicando por su cuenta).
  const rootStyle: React.CSSProperties = {
    ...(config.blur ? {} : { ["--blur-md" as string]: "0px" }),
    ...(config.animaciones
      ? {}
      : {
          ["--motion-fast" as string]: "0ms",
          ["--motion-base" as string]: "0ms",
          ["--motion-slow" as string]: "0ms",
        }),
  };

  return (
    <div
      className="bg-bg text-text flex h-screen flex-col overflow-hidden"
      style={rootStyle}
    >
      <SessionExpiredHandler />
      <AlertStreamMount />

      <Waybar
        role={role}
        userName={userName}
        workspaces={HYPR_WORKSPACES}
        activeWorkspace={activeWorkspace}
        occupancy={occupancy}
        workspaceNames={config.workspaceNames}
        onSwitchWorkspace={setActiveWorkspace}
        onOpenLauncher={() => setLauncherOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onExitHypr={onExitHypr}
      />

      {/* Canvas del workspace activo — mosaico dockview. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="hypr-anim-ws-in relative min-h-0 flex-1"
        aria-label={`Workspace ${activeWorkspace}`}
      >
        <HyprCanvas
          ref={canvasRef}
          activeWorkspace={activeWorkspace}
          onOccupancyChange={setOccupancy}
          gapTiles={config.gapTiles}
        />
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
        onOpenSettings={() => setSettingsOpen(true)}
        onExitHypr={onExitHypr}
        workspaceNames={config.workspaceNames}
      />
      <HyprKeymapHelp open={helpOpen} onOpenChange={setHelpOpen} />
      <HyprSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
