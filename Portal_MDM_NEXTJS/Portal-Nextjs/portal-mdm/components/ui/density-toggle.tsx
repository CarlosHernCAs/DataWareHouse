"use client";

import { Rows3, Rows2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferencias } from "@/components/providers/preferencias-provider";

/**
 * Toggle de densidad para tablas. Cambia `<html data-density>`; las
 * tablas que opten con la clase `.densable` reducen su padding/altura
 * cuando está activo el modo "compacta".
 *
 * Sólo afecta tablas que llevan `.densable`. Listas, dialogs y filtros
 * quedan intactos para evitar regresiones visuales.
 */
export function DensityToggle({ className }: { className?: string }) {
  const { densidad, setDensidad } = usePreferencias();
  const isCompact = densidad === "compacta";
  return (
    <button
      type="button"
      onClick={() => setDensidad(isCompact ? "comoda" : "compacta")}
      aria-pressed={isCompact}
      aria-label={isCompact ? "Cambiar a densidad cómoda" : "Cambiar a densidad compacta"}
      title={isCompact ? "Densidad: compacta" : "Densidad: cómoda"}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-xs text-[var(--color-text-muted)] transition",
        "hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
        className,
      )}
    >
      {isCompact ? (
        <Rows3 aria-hidden className="h-3.5 w-3.5" />
      ) : (
        <Rows2 aria-hidden className="h-3.5 w-3.5" />
      )}
      <span>{isCompact ? "Compacta" : "Cómoda"}</span>
    </button>
  );
}
