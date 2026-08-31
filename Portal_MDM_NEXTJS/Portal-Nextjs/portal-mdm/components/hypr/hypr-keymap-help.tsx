"use client";

/**
 * components/hypr/hypr-keymap-help.tsx
 * ===================================
 * Hoja de atajos del compositor Hypr. Toggle con `?`.
 *
 * Espeja `components/control-center/dwh-keyboard-help.tsx` (Radix Dialog para
 * focus-trap + ESC + backdrop accesibles) y se alimenta de `lib/hypr/keymap.ts`
 * (fuente única de verdad de los atajos).
 */

import * as Dialog from "@radix-ui/react-dialog";
import { Keyboard, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HYPR_KEYMAP } from "@/lib/hypr/keymap";

interface HyprKeymapHelpProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function HyprKeymapHelp({ open, onOpenChange }: HyprKeymapHelpProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="hypr-blur fixed inset-0 z-[110] bg-black/55" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-[110] w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2",
            "hypr-anim-window-open rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl",
          )}
        >
          <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Keyboard aria-hidden className="h-4 w-4 text-[var(--color-text-muted)]" />
              <Dialog.Title className="text-sm font-semibold text-[var(--color-text)]">
                Atajos del compositor
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
            {HYPR_KEYMAP.map((group) => (
              <section key={group.title} className="mb-4 last:mb-0">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {group.title}
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {group.shortcuts.map((sc) => (
                    <li
                      key={sc.label}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="text-[var(--color-text)]">{sc.label}</span>
                      <span className="flex shrink-0 items-center gap-1">
                        {sc.keys.map((k, i) => (
                          <kbd
                            key={i}
                            className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-text)]"
                          >
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
