"use client";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Kv — par clave / valor para la grilla de metadatos del registro            */
/* -------------------------------------------------------------------------- */

interface KvProps {
  label: string;
  value: string;
  mono?: boolean;
}

export function Kv({ label, value, mono }: KvProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd
        className={cn(
          "truncate text-[var(--color-text)]",
          mono && "font-mono",
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ModeRadio — botón de selección de modo resolve / reject                    */
/* -------------------------------------------------------------------------- */

interface ModeRadioProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function ModeRadio({ active, onClick, icon, title, description }: ModeRadioProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-md border px-3 py-2.5 text-left transition",
        "duration-[var(--motion-base)]",
        active
          ? "border-[var(--color-primary)] bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)]"
          : "border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]",
      )}
    >
      <span aria-hidden className="mt-0.5">
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-[var(--color-text)]">{title}</span>
        <span className="text-xs text-[var(--color-text-muted)]">{description}</span>
      </span>
    </button>
  );
}
