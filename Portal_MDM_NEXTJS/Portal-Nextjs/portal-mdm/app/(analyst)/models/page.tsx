import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  FlaskConical,
  Sparkles,
  TrendingUp,
  LineChart,
  GitBranch,
  ShieldAlert,
  Boxes,
  ListOrdered,
  Database,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MODELS,
  MODEL_STATUS_LABEL,
  PROPOSED_MODELS,
  type ModelStatus,
  type ProblemType,
  type Level,
} from "@/lib/mock/models";
import { formatDate, formatNumber } from "@/lib/format";

const STATUS_VARIANT: Record<ModelStatus, "success" | "warning" | "default"> = {
  produccion: "success",
  staging: "warning",
  archivado: "default",
};

const PROBLEM_ICON: Record<ProblemType, LucideIcon> = {
  "Series de tiempo": TrendingUp,
  Regresión: LineChart,
  Clasificación: GitBranch,
  "Detección de anomalías": ShieldAlert,
  Clustering: Boxes,
  "Ranking / Matching": ListOrdered,
};

const LEVEL_TONE: Record<Level, string> = {
  Alto: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  Medio: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  Bajo: "text-slate-300 border-slate-500/30 bg-slate-500/10",
};

export const metadata: Metadata = { title: "Modelos predictivos" };

export default function ModelsListPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Modelos predictivos"
        description="Catálogo de modelos analíticos y propuestas de desarrollo según los datos del DWH."
      />

      {/* ── Modelos en producción (si los hay) ─────────────────── */}
      {MODELS.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            En operación
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {MODELS.map((model) => (
              <Link key={model.id} href={`/models/${model.id}`} className="block focus-visible:outline-none">
                <Card className="transition-colors hover:border-[var(--color-primary)]">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span aria-hidden className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-2)] text-[var(--color-primary)]">
                          <FlaskConical className="h-4 w-4" />
                        </span>
                        <div className="flex flex-col gap-1">
                          <CardTitle>{model.name}</CardTitle>
                          <CardDescription>
                            {model.algorithm} · target: {model.target}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={STATUS_VARIANT[model.status]}>
                        {MODEL_STATUS_LABEL[model.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <dl className="grid grid-cols-3 gap-4">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Accuracy</dt>
                        <dd className="text-lg font-semibold tabular-nums">{(model.accuracy * 100).toFixed(1)}%</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">AUC</dt>
                        <dd className="text-lg font-semibold tabular-nums">{model.auc.toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">F1</dt>
                        <dd className="text-lg font-semibold tabular-nums">{model.f1.toFixed(2)}</dd>
                      </div>
                    </dl>
                    <ChevronRight aria-hidden className="h-5 w-5 text-[var(--color-text-muted)]" />
                  </CardContent>
                  <div className="flex items-center justify-between border-t border-[var(--color-border)] px-5 py-3 text-xs text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles aria-hidden className="h-3.5 w-3.5" />
                      {formatNumber(model.predictions24h)} predicciones (24h)
                    </span>
                    <span className="tabular-nums">Entrenado {formatDate(model.trainedAt)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Propuestos para desarrollo ─────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            Propuestos para desarrollo
          </h2>
          <Badge variant="warning" className="gap-1.5" title="Hoja de ruta · aún no entrenados">
            <FlaskConical aria-hidden className="h-3 w-3" />
            Roadmap · {PROPOSED_MODELS.length} candidatos
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {PROPOSED_MODELS.map((m) => {
            const Icon = PROBLEM_ICON[m.problemType];
            return (
              <Card key={m.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span aria-hidden className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklab,var(--color-primary)_16%,transparent)] text-[var(--color-ring)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-base">{m.name}</CardTitle>
                        <CardDescription>
                          target: <span className="font-mono text-[var(--color-text)]">{m.target}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="default" className="shrink-0">{m.problemType}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="text-sm text-[var(--color-text-muted)]">{m.objective}</p>

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Algoritmos candidatos
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.algorithms.map((a) => (
                        <span key={a} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Fuentes de datos
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.dataSources.map((d) => (
                        <span key={d} className="inline-flex items-center gap-1 rounded-md bg-[color-mix(in_oklab,var(--color-info)_14%,transparent)] px-2 py-0.5 font-mono text-[11px] text-sky-300">
                          <Database className="h-3 w-3" aria-hidden />
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={LEVEL_TONE[m.impact]}>
                        Impacto: {m.impact}
                      </Badge>
                      <Badge variant="outline" className={LEVEL_TONE[m.effort]}>
                        Esfuerzo: {m.effort}
                      </Badge>
                    </div>
                    <div className="flex min-w-[120px] flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--color-text-muted)]">
                        <span>Datos listos</span>
                        <span className="tabular-nums text-[var(--color-text)]">{m.readiness}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-primary)]"
                          style={{ width: `${m.readiness}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
