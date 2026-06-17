// app/(admin)/quality/pipeline-header.tsx
import type { ElementType } from "react";
import { ArrowRight, GitPullRequestArrow, ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineHeaderProps {
  cuarentenaTotal: number;
  cuarentenaPendiente: number;
  homologandoCount: number;
  reinyeccionCount: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

type Tone = "neutral" | "warning" | "primary" | "success";

const TONE_BORDER: Record<Tone, string> = {
  neutral: "border-[var(--color-border)] bg-[var(--color-surface-2)]",
  warning: "border-amber-500/30 bg-amber-500/5",
  primary: "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/8",
  success: "border-emerald-500/30 bg-emerald-500/5",
};
const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-[var(--color-text-muted)]",
  warning: "text-amber-400",
  primary: "text-[var(--color-primary)]",
  success: "text-emerald-400",
};

// Map each tab value to the stage id that should be highlighted as active
const TAB_TO_ACTIVE_STAGE: Record<string, string> = {
  quarantine: "quarantine",
  homologation: "homologation",
  dashboard: "",
};

interface Stage {
  id: string;
  label: string;
  count: number;
  sublabel: string;
  icon: ElementType;
  tone: Tone;
  tab: string;
}

export function PipelineHeader({
  cuarentenaTotal,
  cuarentenaPendiente,
  homologandoCount,
  reinyeccionCount,
  activeTab,
  onTabChange,
}: PipelineHeaderProps) {
  const stages: Stage[] = [
    {
      id: "quarantine",
      label: "Cuarentena",
      count: cuarentenaTotal,
      sublabel: `${cuarentenaPendiente} pendientes`,
      icon: ShieldAlert,
      tone: cuarentenaPendiente > 0 ? "warning" : "success",
      tab: "quarantine",
    },
    {
      id: "homologation",
      label: "Homologación",
      count: homologandoCount,
      sublabel: "en revisión",
      icon: GitPullRequestArrow,
      tone: homologandoCount > 0 ? "primary" : "neutral",
      tab: "homologation",
    },
    {
      id: "reinject",
      label: "Re-inyección",
      count: reinyeccionCount,
      sublabel: "listos para ETL",
      icon: Zap,
      tone: reinyeccionCount > 0 ? "success" : "neutral",
      tab: "homologation",
    },
  ];

  const activeStageId = TAB_TO_ACTIVE_STAGE[activeTab] ?? "";

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Flujo de datos">
      {stages.map((stage, i) => {
        const Icon = stage.icon;
        const isActive = stage.id === activeStageId;
        return (
          <div key={stage.id} className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onTabChange(stage.tab)}
              aria-pressed={isActive}
              aria-label={`Ir a ${stage.label}: ${stage.count} ${stage.sublabel}`}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-5 py-3 text-center transition-all cursor-pointer hover:bg-[var(--color-surface-2)]/30",
                TONE_BORDER[stage.tone],
                isActive && "ring-2 ring-[var(--color-primary)]/40 shadow-md",
              )}
            >
              <Icon className={cn("h-5 w-5", TONE_TEXT[stage.tone])} aria-hidden />
              <span className={cn("text-2xl font-bold tabular-nums leading-none", TONE_TEXT[stage.tone])}>
                {stage.count}
              </span>
              <span className="text-xs font-semibold text-[var(--color-text)]">
                {stage.label}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                {stage.sublabel}
              </span>
            </button>
            {i < stages.length - 1 && (
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-border)]" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
