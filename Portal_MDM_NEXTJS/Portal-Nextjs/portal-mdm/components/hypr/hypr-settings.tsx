"use client";

/**
 * components/hypr/hypr-settings.tsx
 * ================================
 * Panel de configuración del compositor Hypr, estilo "hyprland.conf" (Fase 3).
 * Toggle con `Alt+,`, el engranaje de la waybar o el launcher.
 *
 * Espeja `hypr-keymap-help.tsx` (mismo Radix Dialog, overlay `.hypr-blur` y
 * tokens de superficie). Escribe en `lib/hypr/config-store.ts`; los cambios se
 * aplican en vivo porque el shell consume el mismo store con `useHyprConfig`.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { RotateCcw, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HYPR_WORKSPACES } from "@/lib/hypr/layout-store";
import {
  GAP_TILES_MAX,
  GAP_TILES_MIN,
  useHyprConfig,
} from "@/lib/hypr/config-store";

interface HyprSettingsProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/** Switch accesible (checkbox nativo estilado con tokens). */
function ConfigSwitch({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-4 py-1.5"
    >
      <span className="flex flex-col">
        <span className="text-sm text-[var(--color-text)]">{label}</span>
        <span className="text-xs text-[var(--color-text-muted)]">
          {description}
        </span>
      </span>
      <span className="relative shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "block h-5 w-9 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] transition",
            "peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)]",
            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-ring)]",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            "peer-checked:translate-x-4",
          )}
        />
      </span>
    </label>
  );
}

export function HyprSettings({ open, onOpenChange }: HyprSettingsProps) {
  const { config, setConfig, setWorkspaceName, resetConfig } = useHyprConfig();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="hypr-blur fixed inset-0 z-[110] bg-black/55" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-[110] w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2",
            "hypr-anim-window-open rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl",
          )}
        >
          <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Settings
                aria-hidden
                className="h-4 w-4 text-[var(--color-text-muted)]"
              />
              <Dialog.Title className="text-sm font-semibold text-[var(--color-text)]">
                Configuración del compositor
              </Dialog.Title>
            </div>
            <Dialog.Close
              className="rounded-md p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
              aria-label="Cerrar"
            >
              <X aria-hidden className="h-4 w-4" />
            </Dialog.Close>
          </header>

          <div className="max-h-[70vh] overflow-y-auto p-4">
            {/* Apariencia */}
            <section className="mb-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Apariencia
              </h3>

              {/* Gap entre tiles */}
              <div className="py-1.5">
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="hypr-gap"
                    className="text-sm text-[var(--color-text)]"
                  >
                    Separación entre ventanas
                  </label>
                  <span className="tabular text-xs text-[var(--color-text-muted)]">
                    {config.gapTiles}px
                  </span>
                </div>
                <input
                  id="hypr-gap"
                  type="range"
                  min={GAP_TILES_MIN}
                  max={GAP_TILES_MAX}
                  step={1}
                  value={config.gapTiles}
                  onChange={(e) =>
                    setConfig({ gapTiles: Number(e.target.value) })
                  }
                  aria-label="Separación entre ventanas del mosaico"
                  className="mt-2 w-full accent-[var(--color-primary)]"
                />
              </div>

              <ConfigSwitch
                id="hypr-blur"
                label="Desenfoque (blur)"
                description="Aplica blur a la barra, el dock y los overlays."
                checked={config.blur}
                onChange={(v) => setConfig({ blur: v })}
              />
              <ConfigSwitch
                id="hypr-anim"
                label="Animaciones"
                description="Transiciones al abrir ventanas y cambiar de workspace."
                checked={config.animaciones}
                onChange={(v) => setConfig({ animaciones: v })}
              />
            </section>

            {/* Workspaces */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Workspaces
              </h3>
              <p className="mb-3 text-xs text-[var(--color-text-muted)]">
                Ponle nombre a cada workspace. Si lo dejas vacío se muestra su
                número.
              </p>
              <ul className="flex flex-col gap-2">
                {HYPR_WORKSPACES.map((ws) => (
                  <li key={ws} className="flex items-center gap-3">
                    <span className="tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] text-xs font-medium text-[var(--color-text)]">
                      {ws}
                    </span>
                    <input
                      type="text"
                      value={config.workspaceNames[ws] ?? ""}
                      onChange={(e) => setWorkspaceName(ws, e.target.value)}
                      maxLength={24}
                      placeholder={`Workspace ${ws}`}
                      aria-label={`Nombre del workspace ${ws}`}
                      className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                    />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <footer className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
            <button
              type="button"
              onClick={resetConfig}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            >
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
              Restablecer
            </button>
            <Dialog.Close className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary-foreground)] transition hover:opacity-90">
              Listo
            </Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
