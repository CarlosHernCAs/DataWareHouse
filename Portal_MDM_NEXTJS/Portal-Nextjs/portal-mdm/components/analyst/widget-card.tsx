"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Trash2,
  LineChart,
  BarChart3,
  AreaChart,
  ScatterChart,
  PieChart,
  Gauge,
  Table2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WidgetTipo } from "./widget-config-modal";

interface WidgetCardProps {
  id: string;
  titulo: string;
  tipo: WidgetTipo;
  size: "sm" | "md" | "lg";
  editMode: boolean;
  onEdit: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "col-span-1 row-span-1",
  md: "col-span-2 row-span-1 sm:col-span-2",
  lg: "col-span-2 row-span-2 sm:col-span-2",
};

/** Etiqueta, icono y color por tipo de visualización (chip del header). */
const TYPE_META: Record<WidgetTipo, { label: string; icon: LucideIcon; cls: string }> = {
  linea:    { label: "Línea",      icon: LineChart,    cls: "text-sky-300 bg-sky-500/15" },
  area:     { label: "Área",       icon: AreaChart,    cls: "text-sky-300 bg-sky-500/15" },
  barra:    { label: "Barras",     icon: BarChart3,    cls: "text-emerald-300 bg-emerald-500/15" },
  scatter:  { label: "Dispersión", icon: ScatterChart, cls: "text-cyan-300 bg-cyan-500/15" },
  pie:      { label: "Donut",      icon: PieChart,     cls: "text-amber-300 bg-amber-500/15" },
  kpi:      { label: "KPI",        icon: Gauge,        cls: "text-slate-300 bg-slate-500/20" },
  tabla:    { label: "Tabla",      icon: Table2,       cls: "text-rose-300 bg-rose-500/15" },
  forecast: { label: "Forecast",   icon: TrendingUp,   cls: "text-violet-300 bg-violet-500/15" },
};

export function WidgetCard({
  id,
  titulo,
  tipo,
  size,
  editMode,
  onEdit,
  onRemove,
  children,
}: WidgetCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const meta = TYPE_META[tipo] ?? TYPE_META.linea;
  const TypeIcon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors",
        "hover:border-[color-mix(in_oklab,var(--color-primary)_55%,var(--color-border))] hover:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.6)]",
        SIZE_CLASSES[size],
        isDragging && "z-50 opacity-60 shadow-2xl",
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2.5">
        {editMode && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:cursor-grabbing"
            aria-label="Arrastrar widget"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
            meta.cls,
          )}
        >
          <TypeIcon className="h-3 w-3" aria-hidden />
          {meta.label}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--color-text)]">
          {titulo}
        </span>
        {editMode && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onEdit}
              aria-label="Editar widget"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[var(--color-destructive)] hover:text-[var(--color-destructive)]"
              onClick={onRemove}
              aria-label="Eliminar widget"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="min-h-[120px] flex-1 p-3">{children}</div>
    </div>
  );
}
