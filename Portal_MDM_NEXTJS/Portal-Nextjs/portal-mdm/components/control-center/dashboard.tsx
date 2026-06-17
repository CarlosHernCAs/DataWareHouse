import { PageHeader } from "@/components/ui/page-header";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { HeroKpis } from "./hero-kpis";
import {
  DwhStateCard,
  EtlHealthCard,
  EtlTrendCard,
  LastSyncBadge,
  QualitySummaryCard,
} from "./dashboard-cards";
import { DashboardRefreshControl } from "./dashboard-refresh-control";
import { SystemStatusStrip } from "./system-status-strip";
import { LiveRunsPanel } from "./live-runs-panel";
import { AlertFeedLive } from "./alert-feed-live";

interface DashboardProps {
  title: string;
  description?: string;
}

/**
 * Dashboard Control Center V2.
 *
 * Five zones:
 *   1. PageHeader with inline SystemStatusStrip pills + refresh controls.
 *   2. Hero KPIs — 6 tiles (Pipeline Score, Active Runs, Filas, Fallos, Cuarentena, Alertas).
 *   3. Live Panel (Active runs + Alert feed) | ETL Trend with range selector.
 *   4. DWH State + Data Freshness | Quality Summary.
 *   5. ETL Health Heatmap (14 days, full width).
 */
export function Dashboard({ title, description }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Zone 1: Header */}
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <SystemStatusStrip />
            <div className="flex items-center gap-2">
              <DashboardRefreshControl />
              <LastSyncBadge />
            </div>
          </div>
        }
      />

      {/* Zone 2: Hero KPIs — boundary aislado por tile vía HeroKpis interno */}
      <ErrorBoundary>
        <HeroKpis />
      </ErrorBoundary>

      {/* Zone 3: ETL Trend — full width for better chart legibility */}
      <ErrorBoundary>
        <EtlTrendCard />
      </ErrorBoundary>

      {/* Zone 4: Live Activity | Quality Summary */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
          <ErrorBoundary>
            <LiveRunsPanel />
          </ErrorBoundary>
          <ErrorBoundary>
            <AlertFeedLive />
          </ErrorBoundary>
        </div>
        <div className="lg:col-span-2">
          <ErrorBoundary>
            <QualitySummaryCard />
          </ErrorBoundary>
        </div>
      </section>

      {/* Zone 5: DWH State — full width to show all stats without cramping */}
      <ErrorBoundary>
        <DwhStateCard />
      </ErrorBoundary>

      {/* Zone 6: Health Heatmap — full width */}
      <ErrorBoundary>
        <EtlHealthCard />
      </ErrorBoundary>
    </div>
  );
}
