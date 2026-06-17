"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCardFrame } from "./dashboard-card-frame";

const EtlHealthHeatmap = dynamic(
  () => import("./etl-health-heatmap").then((m) => m.EtlHealthHeatmap),
  { ssr: false, loading: () => <Skeleton className="h-36 rounded-md" /> },
);

export function EtlHealthCard() {
  return (
    <DashboardCardFrame
      title="Salud ETL — últimos 14 días"
      description="Un cuadrado por proceso y día (últimos 14 días): verde = éxito, rojo = fallo."
      href="/etl-monitor"
    >
      <EtlHealthHeatmap />
    </DashboardCardFrame>
  );
}
