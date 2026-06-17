/**
 * Factory tipada de query keys para TanStack Query.
 *
 * Centraliza los strings que hoy aparecen sueltos en cada hook
 * (`["cc", "quality"]`, `["cc", "quarantine-list", pagina, ...]`, etc.).
 * Evita typos al invalidar caches y permite buscar todos los usos de
 * una key navegando el árbol.
 *
 * Convención: cada dominio expone `all()` (root), listas paginadas con
 * sus parámetros y `detail(id)` para registros individuales.
 *
 * Adopción gradual: los hooks existentes siguen funcionando con sus
 * arrays inline; este factory se usa en hooks nuevos y al tocar uno
 * existente por otro motivo. No es necesario migrar todo a la vez.
 */
export const queryKeys = {
  cc: {
    all: () => ["cc"] as const,
    health: () => ["cc", "system-health"] as const,
    dwhState: () => ["cc", "dwh-state"] as const,
    etlRuns: () => ["cc", "etl-runs"] as const,
    etlRun: (id: string) => ["cc", "etl-run", id] as const,
    etlTrend: (range: string) => ["cc", "etl-trend", range] as const,
    factFreshness: () => ["cc", "fact-freshness"] as const,
    activeRuns: () => ["cc", "active-runs"] as const,
    alerts: () => ["cc", "alerts"] as const,
    activity: () => ["cc", "activity"] as const,
  },
  quality: {
    all: () => ["cc", "quality"] as const,
    kpis: () => ["cc", "quality", "kpis"] as const,
    byTable: () => ["cc", "quality", "by-table"] as const,
    trend: (range: string) => ["cc", "quality", "trend", range] as const,
    quarantineList: (params: { pagina: number; tamano: number; tabla?: string | null }) =>
      ["cc", "quarantine-list", params.pagina, params.tamano, params.tabla ?? ""] as const,
  },
  catalogos: {
    all: () => ["catalogos"] as const,
    variedades: () => ["catalogos", "variedades"] as const,
    geografia: () => ["catalogos", "geografia"] as const,
    personal: () => ["catalogos", "personal"] as const,
  },
  analyst: {
    all: () => ["analyst"] as const,
    home: () => ["analyst", "home"] as const,
    views: () => ["analyst", "views"] as const,
    notifications: () => ["analyst", "notifications"] as const,
  },
  proyecciones: {
    all: () => ["proyecciones"] as const,
    tabla: (id: string) => ["proyecciones", "tabla", id] as const,
  },
  bitacora: {
    all: () => ["bitacora"] as const,
    list: (filters: Record<string, unknown>) => ["bitacora", filters] as const,
  },
} as const;
