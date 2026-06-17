import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { EtlControlClient } from "./etl-control-client";

export const metadata: Metadata = { title: "Control ETL" };

export default function EtlControlPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Control ETL"
        description="Monitor en vivo, historial de corridas y bitácora detallada de cargas."
      />
      <EtlControlClient />
    </div>
  );
}
