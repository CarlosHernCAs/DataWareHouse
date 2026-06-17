// app/(admin)/quality/homologation-client.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Info,
  Layers,
  Save,
  Search,
  Sparkles,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import type { HomologationRecord } from "@/lib/schemas/homologation";
import { cn } from "@/lib/utils";
import { QuarantineDrawer } from "@/components/control-center/quarantine-drawer";
import type { QuarantineRecord } from "@/lib/schemas/quality";

interface HomologationClientProps {
  initialData: HomologationRecord[];
  reinyeccionCount: number;
  isReadOnly?: boolean;
}

const PAGE_SIZES = [25, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];

// ---------------------------------------------------------------------------
// BFF helpers — mutaciones via /api/cc/* del portal (cookie httpOnly)
// ---------------------------------------------------------------------------

async function bffResolve(
  tabla: string,
  id: string | number,
  valorCanonico: string,
): Promise<void> {
  const res = await fetch(
    `/api/cc/quality/${encodeURIComponent(tabla)}/${encodeURIComponent(String(id))}/resolver`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ valorCanonico, comentario: null }),
    },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? `Error ${res.status}`);
  }
}

async function bffReject(tabla: string, id: string | number): Promise<void> {
  const res = await fetch(
    `/api/cc/quality/${encodeURIComponent(tabla)}/${encodeURIComponent(String(id))}/rechazar`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ motivo: "Rechazado desde Portal Next.js" }),
    },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? `Error ${res.status}`);
  }
}

async function bffRunReinjection(): Promise<{
  reinyectados: number;
  mensaje?: string | null;
}> {
  const res = await fetch("/api/cc/reinyeccion", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? `Error ${res.status}`);
  }
  return res.json() as Promise<{ reinyectados: number; mensaje?: string | null }>;
}

async function fetchCatalogOptions(campo: string): Promise<string[]> {
  const c = campo.toLowerCase();
  let endpoint = "";
  let extractor: (item: Record<string, unknown>) => string | null;

  if (c.includes("variedad")) {
    endpoint = "/api/cc/catalogos/variedades";
    extractor = (item) => {
      const v = item["nombreCanonico"];
      return typeof v === "string" && v.length > 0 ? v : null;
    };
  } else if (["personal", "nombre", "responsable", "trabajador"].some((x) => c.includes(x))) {
    endpoint = "/api/cc/catalogos/personal";
    extractor = (item) => {
      const v = item["nombreCompleto"];
      return typeof v === "string" && v.length > 0 ? v : null;
    };
  } else if (
    c.includes("fundo") || c.includes("sector") || c.includes("modulo") ||
    c.includes("turno") || c.includes("valvula") || c.includes("cama")
  ) {
    endpoint = "/api/cc/catalogos/geografia";
    const geoKey = c.includes("fundo") ? "fundo"
      : c.includes("sector") ? "sector"
      : c.includes("modulo") ? "modulo"
      : c.includes("turno") ? "turno"
      : c.includes("valvula") ? "valvula"
      : "cama";
    extractor = (item) => {
      const v = item[geoKey];
      if (v == null) return null;
      const s = String(v).trim();
      return s.length > 0 ? s : null;
    };
  } else {
    return [];
  }

  const PAGE_SIZE = 200;
  const accumulated = new Set<string>();
  let pagina = 1;

  while (true) {
    const res = await fetch(`${endpoint}?pagina=${pagina}&tamano=${PAGE_SIZE}`, {
      credentials: "include",
    });
    if (!res.ok) break;
    const data = (await res.json()) as {
      total: number; pagina: number; tamano: number;
      datos: Record<string, unknown>[];
    };
    if (!data.datos || data.datos.length === 0) break;
    for (const item of data.datos) {
      const val = extractor(item);
      if (val !== null) accumulated.add(val);
    }
    if (data.datos.length < PAGE_SIZE) break;
    pagina++;
  }

  return Array.from(accumulated).sort();
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function HomologationClient({
  initialData,
  reinyeccionCount,
  isReadOnly = false,
}: HomologationClientProps) {
  const { toast } = useToast();
  const [data, setData] = useState(initialData);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [highConfOpen, setHighConfOpen] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<QuarantineRecord | null>(null);

  const [tableFilter, setTableFilter] = useState("all");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [catalogCache, setCatalogCache] = useState<Record<string, string[]>>({});

  // Paginación independiente por sección (la selección/correcciones se mantienen
  // por id, así que cambiar de página no pierde el trabajo en curso).
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [highConfPage, setHighConfPage] = useState(1);
  const [needsReviewPage, setNeedsReviewPage] = useState(1);

  useEffect(() => {
    async function loadCatalog() {
      if (fieldFilter !== "all" && !catalogCache[fieldFilter]) {
        try {
          const options = await fetchCatalogOptions(fieldFilter);
          setCatalogCache((prev) => ({ ...prev, [fieldFilter]: options }));
        } catch (e) {
          console.error("Error loading catalog", e);
        }
      }
    }
    loadCatalog();
  }, [fieldFilter, catalogCache]);

  useEffect(() => {
    const highConfIds = initialData
      .filter((d) => d.score >= 0.95)
      .map((d) => d.id_registro);
    setSelectedIds(new Set(highConfIds));
    const initial: Record<string, string> = {};
    initialData.forEach((d) => {
      if (d.valor_sugerido) initial[String(d.id_registro)] = d.valor_sugerido;
    });
    setCorrections(initial);
  }, [initialData]);

  const tableOptions = useMemo(
    () => Array.from(new Set(initialData.map((d) => d.tabla))).sort(),
    [initialData],
  );
  const fieldOptions = useMemo(
    () => Array.from(new Set(initialData.map((d) => d.campo))).sort(),
    [initialData],
  );

  const filteredData = useMemo(
    () =>
      data.filter((d) => {
        const matchTable = tableFilter === "all" || d.tabla === tableFilter;
        const matchField = fieldFilter === "all" || d.campo === fieldFilter;
        const matchSearch =
          !search ||
          d.texto_crudo.toLowerCase().includes(search.toLowerCase()) ||
          d.tabla.toLowerCase().includes(search.toLowerCase());
        return matchTable && matchField && matchSearch;
      }),
    [data, tableFilter, fieldFilter, search],
  );

  const highConfData = useMemo(
    () => filteredData.filter((d) => d.score >= 0.95),
    [filteredData],
  );
  const needsReviewData = useMemo(
    () => filteredData.filter((d) => d.score < 0.95),
    [filteredData],
  );

  // Reset de paginación al cambiar filtros (inline, sin efecto).
  const resetPages = () => {
    setHighConfPage(1);
    setNeedsReviewPage(1);
  };

  const highConfTotalPages = Math.max(1, Math.ceil(highConfData.length / pageSize));
  const needsReviewTotalPages = Math.max(1, Math.ceil(needsReviewData.length / pageSize));

  const highConfPageData = useMemo(
    () => highConfData.slice((highConfPage - 1) * pageSize, highConfPage * pageSize),
    [highConfData, highConfPage, pageSize],
  );
  const needsReviewPageData = useMemo(
    () => needsReviewData.slice((needsReviewPage - 1) * pageSize, needsReviewPage * pageSize),
    [needsReviewData, needsReviewPage, pageSize],
  );

  const reviewedCount = useMemo(
    () =>
      filteredData.filter(
        (d) => selectedIds.has(d.id_registro) && corrections[String(d.id_registro)],
      ).length,
    [filteredData, selectedIds, corrections],
  );

  const toggleSelect = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApproveHighConf = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      highConfData.forEach((d) => next.add(d.id_registro));
      return next;
    });
  };

  const handleSaveSelected = async () => {
    if (selectedIds.size === 0) return;
    setGlobalLoading(true);
    let success = 0;
    let failed = 0;
    for (const id of Array.from(selectedIds)) {
      const record = data.find((d) => d.id_registro === id);
      const correction = corrections[String(id)];
      if (record && correction) {
        try {
          await bffResolve(record.tabla, id, correction);
          success++;
        } catch {
          failed++;
        }
      }
    }
    toast({
      title: "Proceso completado",
      description: `Se guardaron ${success} registros.${failed ? ` ${failed} fallaron.` : ""}`,
      variant: failed ? "destructive" : "default",
    });
    setData((prev) => prev.filter((d) => !selectedIds.has(d.id_registro)));
    setSelectedIds(new Set());
    setGlobalLoading(false);
  };

  const handleRejectSelected = async () => {
    if (selectedIds.size === 0) return;
    setGlobalLoading(true);
    let success = 0;
    for (const id of Array.from(selectedIds)) {
      const record = data.find((d) => d.id_registro === id);
      if (record) {
        try {
          await bffReject(record.tabla, id);
          success++;
        } catch {
          // continue rejecting others
        }
      }
    }
    toast({ title: "Registros rechazados", description: `Se eliminaron ${success} registros de la cola.` });
    setData((prev) => prev.filter((d) => !selectedIds.has(d.id_registro)));
    setSelectedIds(new Set());
    setGlobalLoading(false);
  };

  const handleReinject = async () => {
    setGlobalLoading(true);
    try {
      const res = await bffRunReinjection();
      toast({
        title: "Reinyección exitosa",
        description: res.mensaje ?? `${res.reinyectados} registros vueltos a encolar.`,
      });
    } catch {
      toast({ title: "Error en reinyección", variant: "destructive" });
    }
    setGlobalLoading(false);
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <CheckCircle2 className="h-16 w-16 text-[var(--color-success)]/30" aria-hidden />
        <div>
          <p className="font-semibold text-[var(--color-text)]">¡Cola vacía!</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            No hay registros pendientes de homologación.
          </p>
        </div>
        {reinyeccionCount > 0 && !isReadOnly && (
          <Button onClick={handleReinject} disabled={globalLoading} className="gap-2">
            <Zap className="h-4 w-4" aria-hidden />
            Ejecutar Reinyección ({reinyeccionCount} listos)
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Progress + reinyección */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)]/40 bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-[var(--color-text)]">
              Progreso de homologación
            </span>
            <p className="text-xs text-[var(--color-text-muted)]">
              {reviewedCount} de {filteredData.length} registros con corrección asignada
            </p>
          </div>
          {reinyeccionCount > 0 && !isReadOnly && (
            <Button size="sm" onClick={handleReinject} disabled={globalLoading} className="gap-2 shrink-0">
              <Zap className="h-4 w-4" aria-hidden />
              Reinyectar ({reinyeccionCount})
            </Button>
          )}
        </div>
        <Progress
          value={filteredData.length > 0 ? (reviewedCount / filteredData.length) * 100 : 0}
          className="h-2 [&>div]:bg-[var(--color-success)]"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)]/40 bg-[var(--color-surface)] p-3">
        <div className="relative w-full sm:w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden />
          <Input
            placeholder="Buscar por dato o tabla..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPages(); }}
            className="h-9 pl-9"
          />
        </div>
        <Select value={tableFilter} onValueChange={(v) => { setTableFilter(v); resetPages(); }}>
          <SelectTrigger className="h-9 w-[150px] text-xs">
            <SelectValue placeholder="Tabla" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las tablas</SelectItem>
            {tableOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fieldFilter} onValueChange={(v) => { setFieldFilter(v); resetPages(); }}>
          <SelectTrigger className="h-9 w-[150px] text-xs">
            <SelectValue placeholder="Campo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los campos</SelectItem>
            {fieldOptions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        {(tableFilter !== "all" || fieldFilter !== "all" || search) && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { setTableFilter("all"); setFieldFilter("all"); setSearch(""); resetPages(); }}
            className="h-9 px-2 text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]"
          >
            <XCircle className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>

      {/* Sección: Alta confianza >=95% */}
      {highConfData.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <button
            type="button"
            onClick={() => setHighConfOpen((o) => !o)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-emerald-500/10"
            aria-expanded={highConfOpen}
          >
            {highConfOpen
              ? <ChevronDown className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              : <ChevronRight className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />}
            <Sparkles className="h-4 w-4 text-emerald-400" aria-hidden />
            <span className="flex-1 text-sm font-semibold text-emerald-400">
              Alta confianza &ge; 95%
            </span>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400">
              {highConfData.length} registros
            </Badge>
            {!isReadOnly && (
              <Button
                variant="outline" size="sm"
                onClick={(e) => { e.stopPropagation(); handleApproveHighConf(); }}
                className="h-7 gap-1 border-emerald-500/30 text-[10px] text-emerald-400 hover:bg-emerald-500/10"
              >
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                Seleccionar todos
              </Button>
            )}
          </button>
          {highConfOpen && (
            <div className="border-t border-emerald-500/20">
              <HomologationTable
                rows={highConfPageData}
                corrections={corrections}
                selectedIds={selectedIds}
                catalogCache={catalogCache}
                isReadOnly={isReadOnly}
                onToggle={toggleSelect}
                onCorrectionChange={(id, val) =>
                  setCorrections((prev) => ({ ...prev, [String(id)]: val }))
                }
                onRowClick={(r) => {
                  setSelectedRecord({
                    idRegistro: r.id_registro,
                    tablaOrigen: r.tabla,
                    idRegistroOrigen: null,
                    columnaOrigen: r.campo,
                    valorRaw: r.texto_crudo,
                    motivo: "Sugerencia: " + (r.valor_sugerido || "Ninguna"),
                    estado: "PENDIENTE",
                    fechaIngreso: null,
                  } as unknown as QuarantineRecord);
                }}
              />
              {highConfData.length > pageSize && (
                <div className="border-t border-emerald-500/20 px-4 py-3">
                  <Pagination
                    page={highConfPage}
                    totalPages={highConfTotalPages}
                    total={highConfData.length}
                    pageSize={pageSize}
                    rowsThisPage={highConfPageData.length}
                    pageSizeOptions={PAGE_SIZES}
                    onPage={setHighConfPage}
                    onPageSize={(n) => { setPageSize(n as PageSize); resetPages(); }}
                    className="border-t-0 pt-0"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sección: Requieren revisión <95% */}
      {needsReviewData.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)]/40 bg-[var(--color-surface)] shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--color-border)]/40 px-4 py-3">
            <Info className="h-4 w-4 text-amber-400" aria-hidden />
            <span className="flex-1 text-sm font-semibold text-[var(--color-text)]">
              Requieren revisión &lt; 95%
            </span>
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-400">
              {needsReviewData.length} registros
            </Badge>
          </div>
          <HomologationTable
            rows={needsReviewPageData}
            corrections={corrections}
            selectedIds={selectedIds}
            catalogCache={catalogCache}
            isReadOnly={isReadOnly}
            onToggle={toggleSelect}
            onCorrectionChange={(id, val) =>
              setCorrections((prev) => ({ ...prev, [String(id)]: val }))
            }
            onRowClick={(r) => {
              setSelectedRecord({
                idRegistro: r.id_registro,
                tablaOrigen: r.tabla,
                idRegistroOrigen: null,
                columnaOrigen: r.campo,
                valorRaw: r.texto_crudo,
                motivo: "Sugerencia: " + (r.valor_sugerido || "Ninguna"),
                estado: "PENDIENTE",
                fechaIngreso: null,
              } as unknown as QuarantineRecord);
            }}
          />
          {needsReviewData.length > pageSize && (
            <div className="border-t border-[var(--color-border)]/40 px-4 py-3">
              <Pagination
                page={needsReviewPage}
                totalPages={needsReviewTotalPages}
                total={needsReviewData.length}
                pageSize={pageSize}
                rowsThisPage={needsReviewPageData.length}
                pageSizeOptions={PAGE_SIZES}
                onPage={setNeedsReviewPage}
                onPageSize={(n) => { setPageSize(n as PageSize); resetPages(); }}
                className="border-t-0 pt-0"
              />
            </div>
          )}
        </div>
      )}

      {filteredData.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-text-muted)]">
          No hay registros que coincidan con los criterios.
        </div>
      )}

      {/* Sticky action bar — visible cuando hay seleccionados */}
      {!isReadOnly && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] px-6 py-3 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <span className="text-sm font-medium text-[var(--color-text-muted)]">
            {selectedIds.size} seleccionados
          </span>
          <div className="h-4 w-px bg-[var(--color-border)]" />
          <Button
            variant="outline" size="sm" disabled={globalLoading}
            onClick={handleRejectSelected}
            className="gap-2 hover:border-[var(--color-destructive)]/30 hover:text-[var(--color-destructive)]"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Rechazar
          </Button>
          <Button
            size="sm" disabled={globalLoading}
            onClick={handleSaveSelected}
            className="gap-2 shadow-md"
          >
            <Save className="h-4 w-4" aria-hidden />
            Guardar seleccionados
          </Button>
        </div>
      )}

      <QuarantineDrawer 
        record={selectedRecord} 
        onClose={() => setSelectedRecord(null)} 
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// HomologationTable — subcomponente interno reutilizado por ambas secciones
// ---------------------------------------------------------------------------

interface HomologationTableProps {
  rows: HomologationRecord[];
  corrections: Record<string, string>;
  selectedIds: Set<string | number>;
  catalogCache: Record<string, string[]>;
  isReadOnly: boolean;
  onToggle: (id: string | number) => void;
  onCorrectionChange: (id: string | number, val: string) => void;
  onRowClick: (record: HomologationRecord) => void;
}

function HomologationTable({
  rows,
  corrections,
  selectedIds,
  catalogCache,
  isReadOnly,
  onToggle,
  onCorrectionChange,
  onRowClick,
}: HomologationTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--color-border)]/40 bg-[var(--color-surface-2)]/50">
          <tr>
            {!isReadOnly && <th className="w-10 p-4" />}
            <th className="p-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Origen
            </th>
            <th className="p-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Dato Crudo
            </th>
            <th className="w-[260px] p-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Corrección
            </th>
            <th className="w-[120px] p-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Confianza
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]/40">
          {rows.map((d) => {
            const options = catalogCache[d.campo] || [];
            const hasOptions = options.length > 0;
            const isFact = d.tabla.toLowerCase().includes("fact");

            return (
              <tr
                key={d.id_registro}
                className={cn(
                  "transition-colors hover:bg-[var(--color-surface-2)]/60 cursor-pointer",
                  selectedIds.has(d.id_registro) && "bg-[var(--color-primary)]/5",
                )}
                onClick={() => onRowClick(d)}
              >
                {!isReadOnly && (
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-[var(--color-primary)]"
                      checked={selectedIds.has(d.id_registro)}
                      onChange={() => onToggle(d.id_registro)}
                      aria-label={`Seleccionar registro ${d.id_registro}`}
                    />
                  </td>
                )}
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                        isFact
                          ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                          : "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
                      )}
                    >
                      {isFact ? <Layers className="h-4 w-4" aria-hidden /> : <Database className="h-4 w-4" aria-hidden />}
                    </div>
                    <div className="flex flex-col">
                      <span className="max-w-[110px] truncate text-xs font-semibold">
                        {d.tabla}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                        {d.campo}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <code className="rounded border border-[var(--color-destructive)]/10 bg-[var(--color-destructive)]/5 px-2 py-1 font-mono text-xs text-[var(--color-destructive)]">
                    {d.texto_crudo}
                  </code>
                </td>
                <td className="p-4">
                  {isReadOnly ? (
                    <span className="font-mono text-xs text-[var(--color-text-muted)]">
                      {d.valor_sugerido ?? "—"}
                    </span>
                  ) : hasOptions ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={corrections[String(d.id_registro)] || ""}
                        onValueChange={(val) => onCorrectionChange(d.id_registro, val)}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-9 border-[var(--color-primary)]/20 text-xs",
                            !corrections[String(d.id_registro)] &&
                              "border-dashed italic text-[var(--color-text-muted)]",
                          )}
                        >
                          <SelectValue placeholder="Seleccionar oficial..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {options.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={corrections[String(d.id_registro)] || ""}
                        onChange={(e) => onCorrectionChange(d.id_registro, e.target.value)}
                        className="h-9 border-[var(--color-primary)]/20 pr-8 text-xs"
                        placeholder="Corrección libre..."
                      />
                      <Sparkles className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-primary)]/40" aria-hidden />
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex max-w-[100px] flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span
                        className={
                          d.score >= 0.85
                            ? "text-[var(--color-success)]"
                            : "text-amber-400"
                        }
                      >
                        {Math.round(d.score * 100)}%
                      </span>
                      <Sparkles
                        className={cn(
                          "h-3 w-3",
                          d.score >= 0.9
                            ? "motion-safe:animate-pulse text-[var(--color-primary)]"
                            : "text-[var(--color-text-muted)]/30",
                        )}
                        aria-hidden
                      />
                    </div>
                    <Progress
                      value={d.score * 100}
                      className={cn(
                        "h-1.5",
                        d.score >= 0.85
                          ? "[&>div]:bg-[var(--color-success)]"
                          : "[&>div]:bg-amber-400",
                      )}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
