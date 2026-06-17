"use client";

/**
 * components/control-center/dwh-explain-stale-reason-row.tsx
 * ===========================================================
 * Fila genérica de razón/impacto dentro del diálogo "¿Por qué está stale?".
 *
 * Recibe un `kind` (ok / warn / bad) que controla los tokens de color
 * compartidos con el resto del diálogo vía `dwh-explain-stale-constants`.
 */

import { cn } from "@/lib/utils";
import type { ToneKind } from "./dwh-explain-stale-constants";
import { TONE } from "./dwh-explain-stale-constants";

interface ReasonRowProps {
  icon: React.ReactNode;
  title: string;
  kind: ToneKind;
  children: React.ReactNode;
}

export function ReasonRow({ icon, title, kind, children }: ReasonRowProps) {
  const tone = TONE[kind];
  return (
    <section
      aria-label={title}
      className={cn(
        "flex gap-3 rounded-md border p-3",
        tone.border,
        tone.bg,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded",
          tone.iconBg,
          tone.text,
        )}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {title}
        </p>
        <div className="text-xs text-[var(--color-text-secondary)]">
          {children}
        </div>
      </div>
    </section>
  );
}
