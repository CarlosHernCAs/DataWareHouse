// app/(admin)/quality/quality-shell.tsx
"use client";

import { useState } from "react";
import { GitPullRequestArrow, LayoutDashboard, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PipelineHeader } from "./pipeline-header";
import { QuarantineTable } from "./quarantine-table";
import { HomologationClient } from "./homologation-client";
import {
  QualityByEntityChart,
  QualityGaugeWithData,
  QualityKpiSection,
  QualityTrendChart,
} from "./quality-charts";
import type { QuarantineRecord } from "@/lib/schemas/quarantine";
import type { HomologationRecord } from "@/lib/schemas/homologation";

interface QualityShellProps {
  cuarentenaTotal: number;
  cuarentenaPendiente: number;
  reinyeccionCount: number;
  initialQuarantineData: QuarantineRecord[];
  pendingHomologations: HomologationRecord[];
  isReadOnly?: boolean;
}

export function QualityShell({
  cuarentenaTotal,
  cuarentenaPendiente,
  reinyeccionCount,
  initialQuarantineData,
  pendingHomologations,
  isReadOnly = false,
}: QualityShellProps) {
  const [tab, setTab] = useState("dashboard");
  const homologandoCount = pendingHomologations.length;

  return (
    <div className="flex flex-col gap-6">
      <PipelineHeader
        cuarentenaTotal={cuarentenaTotal}
        cuarentenaPendiente={cuarentenaPendiente}
        homologandoCount={homologandoCount}
        reinyeccionCount={reinyeccionCount}
        activeTab={tab}
        onTabChange={setTab}
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full max-w-[640px] grid-cols-3">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="quarantine" className="gap-2">
            <ShieldAlert className="h-4 w-4" aria-hidden />
            Cuarentena
            {cuarentenaPendiente > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-4 min-w-[18px] px-1 text-[10px] font-bold"
              >
                {cuarentenaPendiente}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="homologation" className="gap-2">
            <GitPullRequestArrow className="h-4 w-4" aria-hidden />
            Homologación
            {homologandoCount > 0 && (
              <Badge variant="default" className="ml-1 h-4 min-w-[18px] px-1 text-[10px] font-bold">
                {homologandoCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Dashboard ───────────────────────────────────────── */}
        <TabsContent value="dashboard" className="mt-4 flex flex-col gap-4">
          <section
            aria-label="KPIs de calidad"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <QualityKpiSection />
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Calidad por tabla</CardTitle>
                <CardDescription>
                  Cuarentena por tabla origen — pendientes / resueltos / descartados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QualityByEntityChart />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Score global</CardTitle>
                <CardDescription>
                  Indicador agregado de calidad maestra.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <QualityGaugeWithData />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolución de Errores</CardTitle>
              <CardDescription>
                Filas insertadas vs. rechazadas por día en la bitácora de carga.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QualityTrendChart />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Cuarentena ──────────────────────────────────────── */}
        <TabsContent value="quarantine" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle>Registros Rechazados</CardTitle>
                <CardDescription>
                  Datos que no superaron las reglas de validación, agrupados por tabla.
                </CardDescription>
              </div>
              {cuarentenaTotal > 0 && (
                <Badge variant="destructive" className="motion-safe:animate-pulse w-fit">
                  {cuarentenaTotal} registros
                </Badge>
              )}
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <QuarantineTable initialData={initialQuarantineData} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Homologación ────────────────────────────────────── */}
        <TabsContent value="homologation" className="mt-4">
          <HomologationClient
            initialData={pendingHomologations}
            reinyeccionCount={reinyeccionCount}
            isReadOnly={isReadOnly}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
