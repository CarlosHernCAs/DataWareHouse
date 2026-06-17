"use client";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useSystemHealth } from "@/hooks/use-control-center";
import type { StatusLevel } from "@/lib/schemas/control-center";

const LABEL: Record<string, string> = {
  etl: "ETL",
  dwh: "DWH",
  quality: "Calidad",
  alerts: "Alertas",
};

const DESCRIPTION: Record<string, string> = {
  etl: "Salud del orquestador y las corridas más recientes.",
  dwh: "Vigencia de los facts del Data Warehouse.",
  quality: "Tasa de registros en cuarentena vs total.",
  alerts: "Alertas críticas no reconocidas en las últimas 48 h.",
};

function levelMeaning(level: StatusLevel | undefined): string {
  switch (level) {
    case "ok":
      return "Todo dentro de umbrales.";
    case "warning":
      return "Atención: hay señales por encima del límite operativo.";
    case "critical":
      return "Acción requerida: el sistema cruzó el umbral crítico.";
    default:
      return "Sin datos en este momento.";
  }
}

function pillClasses(level: StatusLevel | undefined): string {
  switch (level) {
    case "ok":
      return "bg-[var(--color-success-glow)] text-[var(--color-success)] border-[var(--color-success)]/30";
    case "warning":
      return "bg-[var(--color-warning-glow)] text-[var(--color-warning)] border-[var(--color-warning)]/30";
    case "critical":
      return "bg-[var(--color-destructive-glow)] text-[var(--color-destructive)] border-[var(--color-destructive)]/30";
    default:
      return "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]";
  }
}

function dotClasses(level: StatusLevel | undefined): string {
  switch (level) {
    case "ok":
      return "bg-[var(--color-success)]";
    case "warning":
      return "bg-[var(--color-warning)]";
    case "critical":
      return "bg-[var(--color-destructive)] animate-pulse";
    default:
      return "bg-[var(--color-text-muted)]";
  }
}

function levelText(level: StatusLevel | undefined): string {
  switch (level) {
    case "ok": return "OK";
    case "warning": return "Aviso";
    case "critical": return "Crítico";
    default: return "—";
  }
}

/**
 * Inline status pills for the dashboard page header.
 * Shows ETL / DWH / Calidad / Alertas system health at a glance.
 * Dot pulses when any component is critical.
 */
export function SystemStatusStrip() {
  const { data } = useSystemHealth();

  const components: { key: "etl" | "dwh" | "quality" | "alerts"; level: StatusLevel | undefined }[] = [
    { key: "etl", level: data?.etl },
    { key: "dwh", level: data?.dwh },
    { key: "quality", level: data?.quality },
    { key: "alerts", level: data?.alerts },
  ];

  return (
    <div
      role="status"
      aria-label="Estado del sistema"
      className="flex flex-wrap items-center gap-1.5"
    >
      {components.map(({ key, level }) => (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium cursor-help",
                pillClasses(level),
              )}
              tabIndex={0}
            >
              <span
                aria-hidden
                className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotClasses(level))}
              />
              {LABEL[key]}
              <span className="font-normal opacity-80">{levelText(level)}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-center">
            <p className="font-semibold">{LABEL[key]} · {levelText(level)}</p>
            <p className="opacity-80">{DESCRIPTION[key]}</p>
            <p className="mt-1 text-[10px] opacity-70">{levelMeaning(level)}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
