"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Plus,
  Save,
  Eye,
  Pencil,
  LayoutGrid,
  Boxes,
  Shapes,
  Clock,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { WidgetCard } from "./widget-card";
import { PlotlyWidget } from "./plotly-widget";
import type { WidgetConfigFormData } from "./widget-config-modal";
import type { PlotlyFigure } from "./plotly-widget";

export interface WidgetState extends WidgetConfigFormData {
  figure: PlotlyFigure | null;
  loading: boolean;
  error: string | null;
}

interface WidgetGridProps {
  widgets: WidgetState[];
  editMode: boolean;
  saving: boolean;
  userName?: string;
  savedAt?: string | null;
  onReorder: (newOrder: WidgetState[]) => void;
  onAddWidget: () => void;
  onUseTemplate: (preset: Partial<WidgetConfigFormData>) => void;
  onEditWidget: (id: string) => void;
  onRemoveWidget: (id: string) => void;
  onToggleEdit: () => void;
  onSave: () => void;
}

const TEMPLATES: {
  label: string;
  description: string;
  icon: typeof TrendingUp;
  preset: Partial<WidgetConfigFormData>;
}[] = [
  {
    label: "Resumen de cosecha",
    description: "Tendencia diaria por variedad",
    icon: BarChart3,
    preset: { tipo: "linea", titulo: "Cosecha diaria por variedad", size: "lg" },
  },
  {
    label: "Proyección",
    description: "Forecast a varias semanas",
    icon: TrendingUp,
    preset: { tipo: "forecast", titulo: "Proyección de cosecha", size: "md", forecast_periodos: 8 },
  },
  {
    label: "Comparativa por fundo",
    description: "Rendimiento entre fundos",
    icon: Map,
    preset: { tipo: "barra", titulo: "Rendimiento por fundo", size: "md" },
  },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function WidgetGrid({
  widgets,
  editMode,
  saving,
  userName,
  savedAt,
  onReorder,
  onAddWidget,
  onUseTemplate,
  onEditWidget,
  onRemoveWidget,
  onToggleEdit,
  onSave,
}: WidgetGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = widgets.findIndex((w) => w.id === String(active.id));
    const newIdx = widgets.findIndex((w) => w.id === String(over.id));
    if (oldIdx !== -1 && newIdx !== -1) {
      onReorder(arrayMove(widgets, oldIdx, newIdx));
    }
  }

  const tipos = new Set(widgets.map((w) => w.tipo)).size;
  const today = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-5">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            👋 {greeting()}{userName ? `, ${userName.split(" ")[0]}` : ""}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-text-muted)]">
            <span className="capitalize">{today}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--color-text-muted)]/40" aria-hidden />
            <span>
              <b className="text-[var(--color-text)]">{widgets.length}</b> widgets
            </span>
            {savedAt && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--color-success)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] px-2.5 py-0.5 text-[11.5px] font-semibold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                Guardado {formatDateTime(savedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Segmented Ver / Editar */}
          <div
            role="tablist"
            aria-label="Modo del workspace"
            className="inline-flex rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-[3px]"
          >
            <button
              role="tab"
              aria-selected={!editMode}
              onClick={() => { if (editMode) onToggleEdit(); }}
              className={cn(
                "flex items-center gap-1.5 rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                !editMode
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              )}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden /> Ver
            </button>
            <button
              role="tab"
              aria-selected={editMode}
              onClick={() => { if (!editMode) onToggleEdit(); }}
              className={cn(
                "flex items-center gap-1.5 rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                editMode
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              )}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
            </button>
          </div>

          {editMode && (
            <Button size="sm" variant="outline" onClick={onSave} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          )}
          <Button size="sm" onClick={onAddWidget}>
            <Plus className="mr-1 h-4 w-4" /> Añadir widget
          </Button>
        </div>
      </div>

      {/* ── Franja de resumen (meta real del workspace) ───────── */}
      {widgets.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard icon={LayoutGrid} label="Widgets activos" value={String(widgets.length)} />
          <SummaryCard icon={Shapes} label="Tipos de visualización" value={String(tipos)} />
          <SummaryCard
            icon={Boxes}
            label="Tamaño del layout"
            value={editMode ? "Edición" : "Fijo"}
          />
          <SummaryCard
            icon={Clock}
            label="Última actualización"
            value={savedAt ? formatDateTime(savedAt) : "Sin guardar"}
          />
        </div>
      )}

      {/* ── Grid de widgets ──────────────────────────────────── */}
      {widgets.length === 0 && !editMode ? (
        <EmptyState onUseTemplate={onUseTemplate} onToggleEdit={onToggleEdit} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div
              className={cn(
                "grid auto-rows-[172px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
                editMode &&
                  "rounded-xl border border-dashed border-[color-mix(in_oklab,var(--color-primary)_45%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-primary)_5%,transparent)] p-4",
              )}
            >
              {widgets.map((w) => (
                <WidgetCard
                  key={w.id}
                  id={w.id}
                  titulo={w.titulo}
                  tipo={w.tipo}
                  size={w.size}
                  editMode={editMode}
                  onEdit={() => onEditWidget(w.id)}
                  onRemove={() => onRemoveWidget(w.id)}
                >
                  <PlotlyWidget
                    figure={w.figure}
                    loading={w.loading}
                    error={w.error}
                    className="h-full"
                  />
                </WidgetCard>
              ))}

              {editMode && (
                <button
                  onClick={onAddWidget}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[var(--color-text-muted)]/30 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:bg-[color-mix(in_oklab,var(--color-primary)_8%,transparent)] hover:text-[var(--color-ring)]"
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-xs font-medium">Agregar</span>
                </button>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof LayoutGrid;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        <span>{label}</span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--color-primary)_16%,transparent)] text-[var(--color-ring)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <div className="mt-2 truncate text-lg font-bold tabular-nums" title={value}>
        {value}
      </div>
    </div>
  );
}

function EmptyState({
  onUseTemplate,
  onToggleEdit,
}: {
  onUseTemplate: (preset: Partial<WidgetConfigFormData>) => void;
  onToggleEdit: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center">
      <div className="mx-auto mb-3.5 grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_oklab,var(--color-primary)_16%,transparent)] text-[var(--color-ring)]">
        <LayoutGrid className="h-6 w-6" aria-hidden />
      </div>
      <p className="text-base font-bold text-[var(--color-text)]">Construye tu workspace</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
        Empieza con una plantilla o crea un widget desde cero.
      </p>
      <div className="mx-auto mt-5 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              onClick={() => onUseTemplate(t.preset)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
            >
              <Icon className="h-5 w-5 text-[var(--color-ring)]" aria-hidden />
              <p className="mt-2 text-[13px] font-semibold text-[var(--color-text)]">{t.label}</p>
              <p className="mt-0.5 text-[11.5px] text-[var(--color-text-muted)]">{t.description}</p>
            </button>
          );
        })}
      </div>
      <Button variant="ghost" size="sm" className="mt-5" onClick={onToggleEdit}>
        O empieza desde cero
      </Button>
    </div>
  );
}
