"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Grape,
  Loader2,
  MapPinned,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import {
  useDesactivarVariedad,
  useGeografia,
  usePersonal,
  useReactivarVariedad,
  useVariedadesDim,
  useVariedadesMdm,
} from "@/hooks/use-catalogos";
import type {
  Geografia,
  Personal,
  VariedadDim,
  VariedadMdm,
} from "@/lib/schemas/catalogos";
import { NuevaVariedadDialog } from "@/components/control-center/nueva-variedad-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUrlState } from "@/hooks/use-url-state";

type TabId = "variedades" | "geografia" | "personal";

const PAGE_SIZES = [25, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];

/**
 * Tope de filas que pedimos al server por catálogo.
 *
 * Hoy filtramos y paginamos client-side, así que necesitamos el set
 * "completo" en memoria. 5000 cubre los catálogos actuales (variedades,
 * geografía, personal) con margen. Si el total real supera este tope,
 * `<TruncationWarning>` lo hace visible al usuario en vez de mentirle.
 *
 * TODO(fase-2): mover filtros (texto/breeder/estado) al backend FastAPI
 * y bajar este número a la página visible (~50). Requiere:
 *   - backend/api/rutas_catalogos.py: aceptar query params de filtro
 *   - app/api/cc/catalogos/*: propagarlos al proxy
 *   - hooks/use-catalogos.ts: aceptar filtros tipados
 *   - este componente: pasar filtros al hook (sin .filter() local)
 */
const FETCH_TOPE = 5000;

/**
 * Aviso cuando los filtros se aplican sobre un set truncado por el server.
 * Solo se muestra si la BD tiene más filas de las que cargamos.
 */
function TruncationWarning({ cargados, total }: { cargados: number; total: number }) {
  if (total <= cargados) return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning-glow)] px-3 py-2 text-xs text-[var(--color-text)]">
      <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" />
      <span>
        Mostrando <strong>{formatNumber(cargados)}</strong> de{" "}
        <strong>{formatNumber(total)}</strong> registros. Los filtros se aplican
        sólo a los cargados. Refina la búsqueda en el server para ver más.
      </span>
    </div>
  );
}

interface CatalogosClientProps {
  isReadOnly?: boolean;
}

export function CatalogosClient({ isReadOnly = false }: CatalogosClientProps) {
  const [{ tab: rawTab }, setUrlState] = useUrlState({ tab: "variedades" });
  const tab: TabId = (["variedades", "geografia", "personal"] as TabId[]).includes(
    rawTab as TabId,
  )
    ? (rawTab as TabId)
    : "variedades";
  function setTab(t: TabId) { setUrlState({ tab: t }); }

  return (
    <div className="flex flex-col gap-5">
      <nav
        role="tablist"
        aria-label="Catálogos"
        className="flex items-center gap-1 border-b border-[var(--color-border)]"
      >
        <TabButton
          active={tab === "variedades"}
          icon={<Grape aria-hidden className="h-4 w-4" />}
          onClick={() => setTab("variedades")}
        >
          Variedades
        </TabButton>
        <TabButton
          active={tab === "geografia"}
          icon={<MapPinned aria-hidden className="h-4 w-4" />}
          onClick={() => setTab("geografia")}
        >
          Geografía
        </TabButton>
        <TabButton
          active={tab === "personal"}
          icon={<Users aria-hidden className="h-4 w-4" />}
          onClick={() => setTab("personal")}
        >
          Personal
        </TabButton>
      </nav>

      {tab === "variedades" ? (
        <VariedadesSection isReadOnly={isReadOnly} />
      ) : tab === "geografia" ? (
        <GeografiaSection />
      ) : (
        <PersonalSection />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sección: Variedades (subtab MDM vs DWH)                                    */
/* -------------------------------------------------------------------------- */

function VariedadesSection({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const [sub, setSub] = useState<"mdm" | "dim">("dim");

  return (
    <section className="flex flex-col gap-4" aria-label="Variedades">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Origen de variedades"
          className="inline-flex w-fit items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
        >
          <SubTab active={sub === "dim"} onClick={() => setSub("dim")}>
            Dimensión DWH
          </SubTab>
          <SubTab active={sub === "mdm"} onClick={() => setSub("mdm")}>
            Catálogo MDM
          </SubTab>
        </div>
        {sub === "dim" && !isReadOnly ? <NuevaVariedadDialog /> : null}
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        {sub === "dim" ? (
          <>
            Variedades ya homologadas y disponibles para hechos del DWH
            (<span className="font-mono">Silver.Dim_Variedad</span>). Editable
            por administradores.
          </>
        ) : (
          <>
            Catálogo maestro MDM crudo
            (<span className="font-mono">MDM.Catalogo_Variedades</span>) — solo lectura.
          </>
        )}
      </p>

      {sub === "dim" ? <VariedadesDimTabla isReadOnly={isReadOnly} /> : <VariedadesMdmTabla />}
    </section>
  );
}

/* ---- Variedades Dim (Silver) -------------------------------------------- */

function VariedadesDimTabla({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [filtro, setFiltro] = useState("");
  const [filtroBreeder, setFiltroBreeder] = useState("Todas las casas");
  const [filtroEstado, setFiltroEstado] = useState("Todos los estados");
  const query = useVariedadesDim({ pagina: 1, tamano: FETCH_TOPE });
  const { toast } = useToast();
  const desactivar = useDesactivarVariedad();
  const reactivar = useReactivarVariedad();

  const items = useMemo<VariedadDim[]>(
    () => query.data?.datos ?? [],
    [query.data],
  );

  const breeders = useMemo(() => {
    const all = items.map(v => v.breeder).filter(Boolean) as string[];
    return ["Todas las casas", ...Array.from(new Set(all)).sort()];
  }, [items]);

  const filtrados = useMemo(() => {
    let res = items;
    if (filtroBreeder !== "Todas las casas") {
      res = res.filter((v) => v.breeder === filtroBreeder);
    }
    if (filtroEstado === "Activas") {
      res = res.filter((v) => v.esActiva);
    } else if (filtroEstado === "Desactivadas") {
      res = res.filter((v) => !v.esActiva);
    }
    return filtrarPorTexto(res, filtro, (v) => `${v.nombreVariedad} ${v.breeder ?? ""}`);
  }, [items, filtro, filtroBreeder, filtroEstado]);

  const paginados = useMemo(() => filtrados.slice((page - 1) * pageSize, page * pageSize), [filtrados, page, pageSize]);

  function aplicar(idVariedad: number, accion: "desactivar" | "reactivar") {
    const mut = accion === "desactivar" ? desactivar : reactivar;
    mut.mutate(
      { idVariedad },
      {
        onSuccess: (res) =>
          toast({ variant: "success", title: res.mensaje }),
        onError: (err) =>
          toast({
            variant: "destructive",
            title: `No se pudo ${accion}`,
            description: err instanceof Error ? err.message : String(err),
          }),
      },
    );
  }

  return (
    <CatalogoLayout
      page={page}
      pageSize={pageSize}
      onPage={setPage}
      onPageSize={(n) => {
        setPageSize(n);
        setPage(1);
      }}
      total={filtrados.length}
      visible={paginados.length}
      filtro={filtro}
      setFiltro={(val) => { setFiltro(val); setPage(1); }}
      placeholder="Buscar por variedad o breeder…"
      banner={<TruncationWarning cargados={items.length} total={query.data?.total ?? 0} />}
      onRefresh={() => query.refetch()}
      isFetching={query.isFetching}
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      extraFilters={
        <>
          <select
            value={filtroBreeder}
            onChange={(e) => { setFiltroBreeder(e.target.value); setPage(1); }}
            className="h-9 min-w-[140px] bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            aria-label="Filtrar por Breeder"
          >
            {breeders.map(b => <option key={b} value={b}>{b === "Todas las casas" ? "Breeder: Todas las casas" : b}</option>)}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
            className="h-9 min-w-[140px] bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            aria-label="Filtrar por Estado"

          >
            <option value="Todos los estados">Estado: Todos los estados</option>
            <option value="Activas">Estado: Activas</option>
            <option value="Desactivadas">Estado: Desactivadas</option>
          </select>
        </>
      }
    >
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          <tr>
            <th className="px-3 py-2 font-medium">ID</th>
            <th className="px-3 py-2 font-medium">Variedad</th>
            <th className="px-3 py-2 font-medium">Breeder</th>
            <th className="px-3 py-2 font-medium">Estado</th>
            <th className="px-3 py-2 font-medium">Creada</th>
            <th className="px-3 py-2 font-medium">Modificada</th>
            {!isReadOnly && <th className="px-3 py-2 sr-only">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {paginados.map((v) => {
            const busy =
              (desactivar.isPending &&
                desactivar.variables?.idVariedad === v.idVariedad) ||
              (reactivar.isPending &&
                reactivar.variables?.idVariedad === v.idVariedad);
            return (
              <tr
                key={v.idVariedad}
                className="border-t border-[var(--color-border)] transition hover:bg-[var(--color-surface-2)]/60"
              >
                <td className="px-3 py-2 font-mono text-xs text-[var(--color-text-muted)]">
                  {v.idVariedad}
                </td>
                <td className="px-3 py-2 font-medium">{v.nombreVariedad}</td>
                <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                  {v.breeder ?? <span className="text-[var(--color-text-muted)]">—</span>}
                </td>
                <td className="px-3 py-2">
                  <EstadoActivoBadge activa={v.esActiva} />
                </td>
                <td className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  {v.fechaCreacion ? formatDateTime(v.fechaCreacion) : "—"}
                </td>
                <td className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  {v.fechaModificacion ? formatDateTime(v.fechaModificacion) : "—"}
                </td>
                {!isReadOnly && (
                  <td className="px-3 py-2 text-right">
                    {v.esActiva ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => aplicar(v.idVariedad, "desactivar")}
                        disabled={busy}
                        aria-busy={busy}
                        className="h-7 px-2 text-xs"
                      >
                        {busy ? (
                          <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Desactivar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => aplicar(v.idVariedad, "reactivar")}
                        disabled={busy}
                        aria-busy={busy}
                        className="h-7 px-2 text-xs"
                      >
                        {busy ? (
                          <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Reactivar
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </CatalogoLayout>
  );
}

/* ---- Variedades MDM (Catalogo_Variedades) ------------------------------- */

function VariedadesMdmTabla() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [filtro, setFiltro] = useState("");
  const [filtroBreeder, setFiltroBreeder] = useState("Todas las casas");
  const [filtroEstado, setFiltroEstado] = useState("Todos los estados");
  const query = useVariedadesMdm({ pagina: 1, tamano: FETCH_TOPE });

  const items = useMemo<VariedadMdm[]>(
    () => query.data?.datos ?? [],
    [query.data],
  );

  const breeders = useMemo(() => {
    const all = items.map(v => v.breeder).filter(Boolean) as string[];
    return ["Todas las casas", ...Array.from(new Set(all)).sort()];
  }, [items]);

  const filtrados = useMemo(() => {
    let res = items;
    if (filtroBreeder !== "Todas las casas") {
      res = res.filter((v) => v.breeder === filtroBreeder);
    }
    if (filtroEstado === "Activas") {
      res = res.filter((v) => v.esActiva);
    } else if (filtroEstado === "Desactivadas") {
      res = res.filter((v) => !v.esActiva);
    }
    return filtrarPorTexto(res, filtro, (v) => `${v.nombreCanonico} ${v.breeder ?? ""}`);
  }, [items, filtro, filtroBreeder, filtroEstado]);

  const paginados = useMemo(() => filtrados.slice((page - 1) * pageSize, page * pageSize), [filtrados, page, pageSize]);

  return (
    <CatalogoLayout
      page={page}
      pageSize={pageSize}
      onPage={setPage}
      onPageSize={(n) => {
        setPageSize(n);
        setPage(1);
      }}
      total={filtrados.length}
      visible={paginados.length}
      filtro={filtro}
      setFiltro={(val) => { setFiltro(val); setPage(1); }}
      placeholder="Buscar por nombre canónico o breeder…"
      banner={<TruncationWarning cargados={items.length} total={query.data?.total ?? 0} />}
      onRefresh={() => query.refetch()}
      isFetching={query.isFetching}
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      extraFilters={
        <>
          <select
            value={filtroBreeder}
            onChange={(e) => { setFiltroBreeder(e.target.value); setPage(1); }}
            className="h-9 min-w-[140px] bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            aria-label="Filtrar por Breeder"
          >
            {breeders.map(b => <option key={b} value={b}>{b === "Todas las casas" ? "Breeder: Todas las casas" : b}</option>)}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
            className="h-9 min-w-[140px] bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            aria-label="Filtrar por Estado"
          >
            <option value="Todos los estados">Estado: Todos los estados</option>
            <option value="Activas">Estado: Activas</option>
            <option value="Desactivadas">Estado: Desactivadas</option>
          </select>
        </>
      }
    >
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          <tr>
            <th className="px-3 py-2 font-medium">Nombre canónico</th>
            <th className="px-3 py-2 font-medium">Breeder (casa propietaria)</th>
            <th className="px-3 py-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((v) => (
            <tr
              key={v.nombreCanonico}
              className="border-t border-[var(--color-border)] transition hover:bg-[var(--color-surface-2)]/60"
            >
              <td className="px-3 py-2 font-medium">{v.nombreCanonico}</td>
              <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                {v.breeder ?? <span className="text-[var(--color-text-muted)]">—</span>}
              </td>
              <td className="px-3 py-2">
                <EstadoActivoBadge activa={v.esActiva} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CatalogoLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* Sección: Geografía                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Sectores conocidos del MDM. Hardcoded porque (a) son <10 valores
 * estables y (b) con paginación server-side ya no podemos derivar la
 * lista desde `items` (solo veríamos los de la página actual).
 *
 * Mantener sincronizado con `Silver.Dim_Sector_Catalogo`. Si el set
 * crece, considerar endpoint /facets.
 */
const SECTORES_GEOGRAFIA = [
  "Todos los sectores",
  // Los valores reales se conocen al primer fetch — se completan abajo.
] as const;

function GeografiaSection() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [filtro, setFiltro] = useState("");
  const [filtroSector, setFiltroSector] = useState<string>("Todos los sectores");

  // `useDeferredValue` evita un request por cada keystroke. El input se
  // siente inmediato; el query se dispara cuando el usuario hace una pausa.
  const filtroDiferido = useDeferredValue(filtro);

  const textoServer = filtroDiferido.trim() || undefined;
  const sectorServer =
    filtroSector !== "Todos los sectores" ? filtroSector : undefined;

  const query = useGeografia({
    pagina: page,
    tamano: pageSize,
    texto: textoServer,
    sector: sectorServer,
  });

  const items = useMemo<Geografia[]>(
    () => query.data?.datos ?? [],
    [query.data],
  );
  const totalServidor = query.data?.total ?? 0;

  // Lista de sectores: la mantenemos como Set acumulado de lo visto en
  // cualquier página, de modo que el dropdown se enriquece a medida que
  // el usuario navega. Para una solución 100% completa, requeriría un
  // endpoint /facets (TODO si crece la complejidad).
  const sectoresVistos = useMemo(() => {
    const vistos = new Set<string>();
    for (const g of items) if (g.sector) vistos.add(g.sector);
    return Array.from(vistos).sort();
  }, [items]);

  const sectores = useMemo(
    () => [SECTORES_GEOGRAFIA[0], ...sectoresVistos],
    [sectoresVistos],
  );

  return (
    <section aria-label="Geografía agrícola" className="flex flex-col gap-4">
      <p className="text-xs text-[var(--color-text-muted)]">
        Estructura física de la operación agrícola
        (<span className="font-mono">Silver.Dim_Geografia</span>). Solo se muestran
        ubicaciones vigentes.
      </p>
      <CatalogoLayout
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        total={totalServidor}
        visible={items.length}
        filtro={filtro}
        setFiltro={(val) => { setFiltro(val); setPage(1); }}
        placeholder="Buscar por fundo, sector, válvula, código SAP…"
        onRefresh={() => query.refetch()}
        isFetching={query.isFetching}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        extraFilters={
          <select
            value={filtroSector}
            onChange={(e) => { setFiltroSector(e.target.value); setPage(1); }}
            className="h-9 min-w-[120px] bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            aria-label="Filtrar por Sector"
          >
            {sectores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      >
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Fundo</th>
              <th className="px-3 py-2 font-medium">Sector</th>
              <th className="px-3 py-2 text-right font-medium">Módulo</th>
              <th className="px-3 py-2 text-right font-medium">Turno</th>
              <th className="px-3 py-2 font-medium">Válvula</th>
              <th className="px-3 py-2 font-medium">Cama</th>
              <th className="px-3 py-2 font-medium">Código SAP</th>
              <th className="px-3 py-2 font-medium">Bloque de prueba</th>
              <th className="px-3 py-2 font-medium">Vigencia</th>
            </tr>
          </thead>
          <tbody>
            {items.map((g, i) => (
              <tr
                key={`${g.fundo}-${g.sector}-${g.modulo}-${g.valvula}-${g.cama}-${i}`}
                className="border-t border-[var(--color-border)] transition hover:bg-[var(--color-surface-2)]/60"
              >
                <td className="px-3 py-2 font-medium">
                  {g.fundo ?? <span className="text-[var(--color-text-muted)]">—</span>}
                </td>
                <td className="px-3 py-2">{g.sector ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {g.modulo ?? "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {g.turno ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono text-[13px]">
                  {g.valvula ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono text-[13px]">
                  {g.cama ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono text-[13px] text-[var(--color-text-muted)]">
                  {g.codigoSapCampo ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {g.esTestBlock ? (
                    <Badge variant="warning">Sí</Badge>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">No</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {g.esVigente ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 aria-hidden className="h-3 w-3" />
                      Vigente
                    </Badge>
                  ) : (
                    <Badge variant="default">Histórica</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CatalogoLayout>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Sección: Personal                                                          */
/* -------------------------------------------------------------------------- */

function PersonalSection() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [filtro, setFiltro] = useState("");
  const [filtroRol, setFiltroRol] = useState("Todos los roles");
  const [filtroPlanilla, setFiltroPlanilla] = useState("Todas las planillas");
  const query = usePersonal({ pagina: 1, tamano: FETCH_TOPE });

  const items = useMemo<Personal[]>(
    () => query.data?.datos ?? [],
    [query.data],
  );

  const roles = useMemo(() => ["Todos los roles", ...Array.from(new Set(items.map(p => p.rol).filter(Boolean) as string[])).sort()], [items]);
  const planillas = useMemo(() => ["Todas las planillas", ...Array.from(new Set(items.map(p => p.idPlanilla).filter(Boolean) as string[])).sort()], [items]);

  const filtrados = useMemo(() => {
    let res = items;
    if (filtroRol !== "Todos los roles") res = res.filter(p => p.rol === filtroRol);
    if (filtroPlanilla !== "Todas las planillas") res = res.filter(p => p.idPlanilla === filtroPlanilla);

    return filtrarPorTexto(
      res,
      filtro,
      (p) => `${p.dni ?? ""} ${p.nombreCompleto ?? ""} ${p.rol ?? ""} ${p.idPlanilla ?? ""}`,
    );
  }, [items, filtro, filtroRol, filtroPlanilla]);

  const paginados = useMemo(() => filtrados.slice((page - 1) * pageSize, page * pageSize), [filtrados, page, pageSize]);

  return (
    <section aria-label="Personal" className="flex flex-col gap-4">
      <p className="text-xs text-[var(--color-text-muted)]">
        Catálogo del personal cargado en el DWH
        (<span className="font-mono">Silver.Dim_Personal</span>). Las métricas de
        asertividad y ausencia provienen de planilla.
      </p>
      <CatalogoLayout
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        total={filtrados.length}
        visible={paginados.length}
        filtro={filtro}
        setFiltro={(val) => { setFiltro(val); setPage(1); }}
        placeholder="Buscar por DNI, nombre, rol o planilla…"
        banner={<TruncationWarning cargados={items.length} total={query.data?.total ?? 0} />}
        onRefresh={() => query.refetch()}
        isFetching={query.isFetching}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        extraFilters={
          <>
            <select
              value={filtroRol}
              onChange={(e) => { setFiltroRol(e.target.value); setPage(1); }}
              className="h-9 min-w-[120px] bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              aria-label="Filtrar por Rol"
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={filtroPlanilla}
              onChange={(e) => { setFiltroPlanilla(e.target.value); setPage(1); }}
              className="h-9 min-w-[120px] bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              aria-label="Filtrar por Planilla"
            >
              {planillas.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </>
        }
      >
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">DNI</th>
              <th className="px-3 py-2 font-medium">Nombre completo</th>
              <th className="px-3 py-2 font-medium">Rol</th>
              <th className="px-3 py-2 font-medium">Sexo</th>
              <th className="px-3 py-2 font-medium">Planilla</th>
              <th className="px-3 py-2 font-medium">Asertividad</th>
              <th className="px-3 py-2 font-medium">Días de ausencia</th>
            </tr>
          </thead>
          <tbody>
            {paginados.map((p, i) => (
              <tr
                key={`${p.dni}-${i}`}
                className="border-t border-[var(--color-border)] transition hover:bg-[var(--color-surface-2)]/60"
              >
                <td className="px-3 py-2 font-mono text-[13px]">{p.dni ?? "—"}</td>
                <td className="px-3 py-2 font-medium">
                  {p.nombreCompleto ?? "—"}
                </td>
                <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                  {p.rol ?? "—"}
                </td>
                <td className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  {sexoLegible(p.sexo)}
                </td>
                <td className="px-3 py-2 font-mono text-[13px] text-[var(--color-text-muted)]">
                  {p.idPlanilla ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <BarraAsertividad valor={p.pctAsertividad} />
                </td>
                <td className="px-3 py-2">
                  <AusentismoBadge dias={p.diasAusentismo} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CatalogoLayout>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Subcomponentes compartidos                                                  */
/* -------------------------------------------------------------------------- */

interface CatalogoLayoutProps {
  children: React.ReactNode;
  page: number;
  pageSize: PageSize;
  onPage: (n: number) => void;
  onPageSize: (n: PageSize) => void;
  total: number;
  visible: number;
  filtro: string;
  setFiltro: (s: string) => void;
  placeholder: string;
  onRefresh: () => void;
  isFetching: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  extraFilters?: React.ReactNode;
  /** Banner opcional renderizado entre la toolbar y la tabla. */
  banner?: React.ReactNode;
}

function CatalogoLayout({
  children,
  page,
  pageSize,
  onPage,
  onPageSize,
  total,
  visible,
  filtro,
  setFiltro,
  placeholder,
  onRefresh,
  isFetching,
  isLoading,
  isError,
  error,
  extraFilters,
  banner,
}: CatalogoLayoutProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] max-w-md flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <Input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="pl-9 h-9"
            />
          </div>
          {extraFilters}
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span className="tabular-nums">
            {visible !== total && filtro
              ? `${formatNumber(visible)} visibles de ${formatNumber(total)}`
              : `${formatNumber(total)} registros`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            aria-label="Refrescar"
            className="gap-1.5"
          >
            <RefreshCw
              aria-hidden
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            />
            Refrescar
          </Button>
        </div>
      </div>

      {banner}

      {isError ? (
        <ErrorBlock
          message={error instanceof Error ? error.message : "Error al cargar"}
          onRetry={onRefresh}
        />
      ) : isLoading ? (
        <TablaSkeleton />
      ) : visible === 0 ? (
        <EmptyBlock filtroActivo={filtro.length > 0} />
      ) : (
        <div className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
          {children}
        </div>
      )}

      {total > 0 ? (
        <nav
          aria-label="Paginación"
          className="flex flex-col items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3 text-xs sm:flex-row"
        >
          <p className="text-[var(--color-text-muted)] tabular-nums">
            {formatNumber(desde)}–{formatNumber(hasta)} de {formatNumber(total)}
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[var(--color-text-muted)]">
              Filas por página
              <select
                value={pageSize}
                onChange={(e) =>
                  onPageSize(Number(e.target.value) as PageSize)
                }
                className="bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                aria-label="Filas por página"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                aria-label="Página anterior"
                className="h-8 w-8 p-0"
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
              </Button>
              <span className="min-w-[60px] text-center text-[var(--color-text-secondary)] tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                aria-label="Página siguiente"
                className="h-8 w-8 p-0"
              >
                <ChevronRight aria-hidden className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex min-h-[42px] items-center gap-2 px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
        active
          ? "border-b-2 border-[var(--color-primary)] text-[var(--color-text)]"
          : "border-b-2 border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function SubTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "min-h-[32px] rounded px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
        active
          ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]",
      )}
    >
      {children}
    </button>
  );
}

function EstadoActivoBadge({ activa }: { activa: boolean }) {
  return activa ? (
    <Badge variant="success" className="gap-1">
      <ShieldCheck aria-hidden className="h-3 w-3" />
      Activa
    </Badge>
  ) : (
    <Badge variant="default" className="gap-1 opacity-80">
      <XCircle aria-hidden className="h-3 w-3" />
      Inactiva
    </Badge>
  );
}

function sexoLegible(s: string | null): string {
  if (!s) return "—";
  const norm = s.trim().toUpperCase();
  if (norm.startsWith("F")) return "Femenino";
  if (norm.startsWith("M")) return "Masculino";
  return s;
}

function BarraAsertividad({ valor }: { valor: number | null }) {
  if (valor == null)
    return <span className="text-xs text-[var(--color-text-muted)]">—</span>;
  const pct = Math.max(0, Math.min(100, valor));
  const tono =
    pct >= 90
      ? "var(--color-success)"
      : pct >= 70
        ? "var(--color-warning)"
        : "var(--color-destructive)";
  return (
    <div className="flex items-center gap-2">
      <span
        className="min-w-[42px] text-right text-xs font-semibold tabular-nums"
        style={{ color: tono }}
      >
        {formatPercent(pct, 0)}
      </span>
      <div
        className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-surface-2)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Asertividad ${pct.toFixed(0)} por ciento`}
      >
        <div
          className="h-full"
          style={{ width: `${pct}%`, backgroundColor: tono }}
        />
      </div>
    </div>
  );
}

function AusentismoBadge({ dias }: { dias: number | null }) {
  if (dias == null)
    return <span className="text-xs text-[var(--color-text-muted)]">—</span>;
  if (dias === 0)
    return (
      <Badge variant="success" className="gap-1">
        0 días
      </Badge>
    );
  if (dias <= 5) return <Badge variant="default">{dias} días</Badge>;
  if (dias <= 15) return <Badge variant="warning">{dias} días</Badge>;
  return <Badge variant="destructive">{dias} días</Badge>;
}

function TablaSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  );
}

function EmptyBlock({ filtroActivo }: { filtroActivo: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-center text-sm">
      <p className="font-medium text-[var(--color-text)]">
        {filtroActivo ? "Sin resultados para tu búsqueda" : "Sin registros"}
      </p>
      <p className="max-w-sm text-xs text-[var(--color-text-muted)]">
        {filtroActivo
          ? "Prueba con menos palabras o ampliando el filtro."
          : "Aún no hay datos cargados en este catálogo."}
      </p>
    </div>
  );
}

function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-md border border-[var(--color-destructive)]/40 bg-[color-mix(in_oklab,var(--color-destructive)_8%,transparent)] px-4 py-3 text-sm text-[var(--color-destructive)]"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRetry}
        className="w-fit gap-1.5"
      >
        <RefreshCw aria-hidden className="h-3.5 w-3.5" />
        Reintentar
      </Button>
    </div>
  );
}

function filtrarPorTexto<T>(
  items: T[],
  filtro: string,
  pluck: (t: T) => string,
): T[] {
  const q = filtro.trim().toLowerCase();
  if (q === "") return items;
  return items.filter((it) => pluck(it).toLowerCase().includes(q));
}
