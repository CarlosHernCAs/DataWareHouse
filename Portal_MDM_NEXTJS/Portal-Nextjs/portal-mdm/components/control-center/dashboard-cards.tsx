/**
 * dashboard-cards.tsx — índice de re-exportación.
 *
 * Cada card vive en su propio archivo para facilitar la lectura y el
 * mantenimiento. Este módulo reexporta los componentes públicos para que
 * los consumidores (`dashboard.tsx`, tests, etc.) no necesiten cambiar
 * sus imports.
 *
 * Árbol de archivos relacionados:
 *   dashboard-card-primitives.tsx   → helpers compartidos (timeAgo, ErrorState, EmptyState, Stat, pickLevel)
 *   dashboard-card-etl-trend.tsx    → EtlTrendCard
 *   dashboard-card-dwh-state.tsx    → DwhStateCard
 *   dashboard-card-quality.tsx      → QualitySummaryCard
 *   dashboard-card-last-sync.tsx    → LastSyncBadge
 *   dashboard-card-etl-health.tsx   → EtlHealthCard
 */

export { EtlTrendCard } from "./dashboard-card-etl-trend";
export { DwhStateCard } from "./dashboard-card-dwh-state";
export { QualitySummaryCard } from "./dashboard-card-quality";
export { LastSyncBadge } from "./dashboard-card-last-sync";
export { EtlHealthCard } from "./dashboard-card-etl-health";
