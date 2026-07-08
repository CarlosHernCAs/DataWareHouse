"use client";

import { QualityShell } from "@/app/(admin)/quality/quality-shell";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useQuarantineList } from "@/hooks/use-quality";
import type { QuarantineRecord } from "@/lib/schemas/quarantine";

/**
 * Ventana de "Calidad" para el compositor Hypr.
 *
 * `QualityShell` es la única shell admin que hoy recibe datos iniciales desde
 * su server component. Aquí los reconstruimos en cliente vía React Query
 * (`useQuarantineList` → `/api/cc/quality/list`, que devuelve camelCase) y los
 * mapeamos al shape snake_case que espera `QuarantineTable` (no refetchea:
 * vive de `initialData`).
 *
 * TODO (Fase 2/3): la pestaña Homologación queda vacía en el compositor —
 * `HomologationClient` no tiene aún un fetch de cliente aislado y la
 * reinyección solo expone POST /ejecutar. Para esos flujos el admin puede usar
 * "Vista clásica"; el objetivo es exponer GETs de cliente dedicados.
 */
export function QualityWindow() {
  const { data, isLoading, isError } = useQuarantineList({
    pagina: 1,
    tamano: 100,
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <PageSkeleton template="dashboard-with-table" kpiCount={3} />
      </div>
    );
  }

  const raw = data?.datos ?? [];
  const total = data?.total ?? 0;
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

  return (
    <div className="p-4">
      {isError && (
        <p className="mb-3 text-sm text-[var(--color-destructive)]">
          No se pudo cargar la cuarentena. Reintentando en segundo plano…
        </p>
      )}
      <QualityShell
        cuarentenaTotal={total}
        cuarentenaPendiente={pendientes}
        reinyeccionCount={0}
        initialQuarantineData={initialQuarantineData}
        pendingHomologations={[]}
        isReadOnly={false}
      />
    </div>
  );
}
