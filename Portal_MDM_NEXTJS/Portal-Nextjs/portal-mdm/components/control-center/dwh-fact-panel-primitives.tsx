"use client";

/**
 * components/control-center/dwh-fact-panel-primitives.tsx
 * ========================================================
 * Átomos puramente presentacionales de DwhFactPanel.
 * Ninguno de estos componentes tiene estado ni side-effects.
 */

import { cn } from "@/lib/utils";

/* ── Metric ─────────────────────────────────────────────────────────────── */

export interface MetricProps {
  label: string;
  value: string;
  tone?: "default" | "warning";
  wide?: boolean;
}

export function Metric({ label, value, tone = "default", wide }: MetricProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5",
        wide && "col-span-2",
      )}
    >
      <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums text-sm font-semibold",
          tone === "warning"
            ? "text-[var(--color-warning)]"
            : "text-[var(--color-text)]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Section ─────────────────────────────────────────────────────────────── */

export function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="mt-4 flex flex-col gap-1.5">
      <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        {icon ? <span aria-hidden>{icon}</span> : null}
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

/* ── TableList ───────────────────────────────────────────────────────────── */

export function TableList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((it) => (
        <li
          key={it}
          className="break-all rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 font-mono text-xs text-[var(--color-text-secondary)]"
          title={it}
        >
          {it}
        </li>
      ))}
    </ul>
  );
}

/* ── Empty ───────────────────────────────────────────────────────────────── */

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded border border-dashed border-[var(--color-border)] px-3 py-2 text-xs italic text-[var(--color-text-muted)]">
      {children}
    </p>
  );
}
