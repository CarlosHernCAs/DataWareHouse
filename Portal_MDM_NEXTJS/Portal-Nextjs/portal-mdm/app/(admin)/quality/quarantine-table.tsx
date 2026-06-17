// app/(admin)/quality/quarantine-table.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  FileWarning,
  Filter,
  Layers,
  Search,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import type { QuarantineRecord } from "@/lib/schemas/quarantine";
import type { QuarantineRecord as QuarantineDrawerRecord } from "@/lib/schemas/quality";
import { formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { QuarantineDrawer } from "@/components/control-center/quarantine-drawer";

interface QuarantineTableProps {
  initialData: QuarantineRecord[];
}

const PAGE_SIZES = [25, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];

export function QuarantineTable({ initialData }: QuarantineTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [selectedRecord, setSelectedRecord] = useState<QuarantineDrawerRecord | null>(null);

  const statusOptions = useMemo(
    () => Array.from(new Set(initialData.map((r) => r.estado))).sort(),
    [initialData],
  );
  const tableOptions = useMemo(
    () => Array.from(new Set(initialData.map((r) => r.tabla_origen))).sort(),
    [initialData],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialData.filter((r) => {
      const matchStatus = statusFilter === "all" || r.estado === statusFilter;
      const matchTable = tableFilter === "all" || r.tabla_origen === tableFilter;
      const matchSearch =
        q === "" ||
        [r.tabla_origen, r.columna_origen, r.motivo, r.valor_raw]
          .map((v) => (v == null ? "" : String(v)).toLowerCase())
          .some((s) => s.includes(q));
      return matchStatus && matchTable && matchSearch;
    });
  }, [initialData, statusFilter, tableFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginados = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const hasFilters = statusFilter !== "all" || tableFilter !== "all" || search.length > 0;

  if (initialData.length === 0) {
    return (
      <div className="py-16 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--color-success)]/30" aria-hidden />
        <p className="mt-3 text-sm font-medium text-[var(--color-text-muted)]">
          Sin registros en cuarentena
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full space-y-4 px-4 sm:px-0">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)]/40 bg-[var(--color-surface)]/50 p-3">
          <Filter className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
          <div className="relative min-w-[200px] flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <Input
              placeholder="Buscar por tabla, columna, valor o motivo…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-9"
              aria-label="Buscar en cuarentena"
            />
          </div>
          <Select
            value={tableFilter}
            onValueChange={(v) => {
              setTableFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[180px] text-xs">
              <SelectValue placeholder="Tabla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las tablas</SelectItem>
              {tableOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setTableFilter("all");
                setSearch("");
                setPage(1);
              }}
              className="h-8 gap-1.5 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]"
            >
              <XCircle className="h-3 w-3" aria-hidden />
              Limpiar
            </Button>
          )}
          <span className="ml-auto text-xs tabular-nums text-[var(--color-text-muted)]">
            {formatNumber(filtered.length)} registros
          </span>
        </div>

        {/* Tabla */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-text-muted)]">
            No se encontraron registros con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)]/40 bg-[var(--color-surface)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface-2)]/50">
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    <th className="px-4 py-2.5">Tabla</th>
                    <th className="px-4 py-2.5">Columna</th>
                    <th className="px-4 py-2.5">Valor</th>
                    <th className="px-4 py-2.5">Motivo</th>
                    <th className="px-4 py-2.5">Estado</th>
                    <th className="px-4 py-2.5">Ingresado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]/40">
                  {paginados.map((r, i) => {
                    const isPendiente = r.estado.toUpperCase() === "PENDIENTE";
                    const isFact = r.tabla_origen.toLowerCase().startsWith("fact");
                    return (
                      <tr
                        key={`${r.tabla_origen}-${r.id_registro}-${i}`}
                        className="cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]/80"
                        onClick={() =>
                          setSelectedRecord({
                            idRegistro: String(r.id_registro),
                            tablaOrigen: r.tabla_origen,
                            idRegistroOrigen: null,
                            columnaOrigen: r.columna_origen ?? "",
                            valorRaw:
                              r.valor_raw == null
                                ? ""
                                : typeof r.valor_raw === "object"
                                  ? JSON.stringify(r.valor_raw)
                                  : String(r.valor_raw),
                            motivo: r.motivo ?? null,
                            estado: r.estado as QuarantineDrawerRecord["estado"],
                            fechaIngreso: r.fecha_ingreso,
                            nombreArchivo: r.nombre_archivo ?? null,
                          })
                        }
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                                isFact
                                  ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                                  : "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
                              )}
                            >
                              {isFact ? (
                                <Layers className="h-3.5 w-3.5" aria-hidden />
                              ) : (
                                <Database className="h-3.5 w-3.5" aria-hidden />
                              )}
                            </div>
                            <span className="max-w-[160px] truncate text-xs font-semibold">
                              {r.tabla_origen}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-xs text-[var(--color-text-muted)]">
                            {r.columna_origen || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-col gap-1.5">
                            <code className={cn(
                              "w-fit rounded border px-1.5 py-0.5 font-mono text-xs",
                              r.valor_corregido 
                                ? "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] line-through opacity-60"
                                : "border-[var(--color-destructive)]/10 bg-[var(--color-destructive)]/5 text-[var(--color-destructive)]"
                            )}>
                              {r.valor_raw == null
                                ? "NULL"
                                : typeof r.valor_raw === "object"
                                  ? JSON.stringify(r.valor_raw)
                                  : String(r.valor_raw)}
                            </code>
                            {r.valor_corregido && (
                              <code className="w-fit rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                                {r.valor_corregido}
                              </code>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex max-w-[220px] cursor-help items-center gap-1.5">
                                <FileWarning className="h-3.5 w-3.5 shrink-0 text-[var(--color-warning)]" aria-hidden />
                                <span className="truncate text-xs text-[var(--color-text-muted)]">
                                  {r.motivo || "Error de validación"}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">{r.motivo}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1 text-[10px] font-bold uppercase",
                              isPendiente
                                ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
                            )}
                          >
                            {isPendiente ? (
                              <Clock className="h-3 w-3" aria-hidden />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" aria-hidden />
                            )}
                            {r.estado}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                            <Calendar className="h-3 w-3" aria-hidden />
                            {formatDateTime(r.fecha_ingreso)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-[var(--color-border)]/40 px-4 py-3">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={filtered.length}
                pageSize={pageSize}
                rowsThisPage={paginados.length}
                pageSizeOptions={PAGE_SIZES}
                onPage={setPage}
                onPageSize={(n) => {
                  setPageSize(n as PageSize);
                  setPage(1);
                }}
                className="border-t-0 pt-0"
              />
            </div>
          </div>
        )}

        <QuarantineDrawer
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </div>
    </TooltipProvider>
  );
}
