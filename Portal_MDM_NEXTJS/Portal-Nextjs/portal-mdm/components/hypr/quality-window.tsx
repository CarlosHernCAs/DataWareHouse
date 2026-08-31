"use client";

import { useQuery } from "@tanstack/react-query";
import { QualityShell } from "@/app/(admin)/quality/quality-shell";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useQuarantineList } from "@/hooks/use-quality";
import { homologationRecordSchema, type HomologationRecord } from "@/lib/schemas/homologation";
import type { QuarantineRecord } from "@/lib/schemas/quarantine";

/**
 * Ventana de "Calidad" para el compositor Hypr.
 *
 * `QualityShell` es la única shell admin que hoy recibe datos iniciales desde
 * su server component. Aquí los reconstruimos en cliente:
 *   - Cuarentena: `useQuarantineList` (`/api/cc/quality/list`, camelCase) mapeado
 *     al shape snake_case que espera `QuarantineTable`.
 *   - Homologaciones: `/api/cc/quality/homologaciones` (ruta BFF dedicada).
 *   - Reinyección: `/api/cc/reinyeccion/candidatos` (ruta BFF dedicada).
 *
 * Con esto la ventana de Calidad queda 100% funcional dentro del compositor,
 * sin necesidad de caer al shell clásico.
 */
async function fetchHomologaciones(): Promise<HomologationRecord[]> {
  const r = await fetch("/api/cc/quality/homologaciones", { credentials: "include" });
  if (!r.ok) return [];
  const parsed = homologationRecordSchema.array().safeParse(await r.json());
  return parsed.success ? parsed.data : [];
}

async function fetchReinyeccionCount(): Promise<number> {
  const r = await fetch("/api/cc/reinyeccion/candidatos", { credentials: "include" });
  if (!r.ok) return 0;
  const j = (await r.json()) as { candidatos?: unknown };
  return Number(j?.candidatos ?? 0);
}

export function QualityWindow() {
  const cuarentena = useQuarantineList({ pagina: 1, tamano: 100 });
  const homologaciones = useQuery({
    queryKey: ["hypr", "quality", "homologaciones"],
    queryFn: fetchHomologaciones,
    staleTime: 30_000,
  });
  const reinyeccion = useQuery({
    queryKey: ["hypr", "quality", "reinyeccion-candidatos"],
    queryFn: fetchReinyeccionCount,
    staleTime: 30_000,
  });

  if (cuarentena.isLoading) {
    return (
      <div className="p-4">
        <PageSkeleton template="dashboard-with-table" kpiCount={3} />
      </div>
    );
  }

  const raw = cuarentena.data?.datos ?? [];
  const total = cuarentena.data?.total ?? 0;
  const pendientes = raw.filter(
    (r) => String(r.estado).toUpperCase() === "PENDIENTE",
  ).length;

  // camelCase (schema quality.ts) → snake_case (schema quarantine.ts).
  const initialQuarantineData: QuarantineRecord[] = raw.map((r) => ({
    id_registro: r.idRegistro,
    tabla_origen: r.tablaOrigen,
    columna_origen: r.columnaOrigen,
    valor_raw: r.valorRaw,
    nombre_archivo: r.nombreArchivo,
    fecha_ingreso: r.fechaIngreso ?? "",
    estado: r.estado,
    motivo: r.motivo,
  }));

  const pendingHomologations = homologaciones.data ?? [];

  return (
    <div className="p-4">
      {cuarentena.isError && (
        <p className="mb-3 text-sm text-[var(--color-destructive)]">
          No se pudo cargar la cuarentena. Reintentando en segundo plano…
        </p>
      )}
      <QualityShell
        cuarentenaTotal={total}
        cuarentenaPendiente={pendientes}
        reinyeccionCount={reinyeccion.data ?? 0}
        initialQuarantineData={initialQuarantineData}
        pendingHomologations={pendingHomologations}
        isReadOnly={false}
      />
    </div>
  );
}
