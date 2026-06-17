"use client";

import { formatDateTime } from "@/lib/format";
import type { QuarantineRecord } from "@/lib/schemas/quality";
import { QuarantineCompositeEditor } from "@/components/control-center/quarantine-composite-editor";
import { Kv } from "./quarantine-drawer-primitives";

interface QuarantineContextPanelProps {
  record: QuarantineRecord;
}

/**
 * Columna izquierda del modal de cuarentena.
 *
 * Muestra los metadatos del registro (tabla, archivo, fecha) y el
 * valor recibido en modo lectura. No gestiona ningún estado de formulario.
 */
export function QuarantineContextPanel({ record }: QuarantineContextPanelProps) {
  return (
    <section
      aria-label="Contexto del registro"
      className="flex flex-col gap-4 overflow-y-auto bg-[var(--color-surface-2)]/40 px-6 py-5"
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        Origen del dato
      </h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <Kv label="Tabla" value={record.tablaOrigen} mono />
        {record.idRegistroOrigen != null ? (
          <Kv label="Registro origen" value={`#${record.idRegistroOrigen}`} />
        ) : null}
        {record.nombreArchivo ? (
          <Kv label="Archivo" value={record.nombreArchivo} mono />
        ) : null}
        {record.fechaIngreso ? (
          <Kv
            label="Ingresado"
            value={formatDateTime(record.fechaIngreso)}
          />
        ) : null}
      </dl>

      {/*
        Valores recibidos en modo LECTURA — útil para entender qué llegó
        sin tocar el campo canónico. El editor de la derecha muestra lo
        mismo con inputs editables (modo "edit").
      */}
      <QuarantineCompositeEditor
        key={`view-${record.tablaOrigen}-${record.idRegistro}`}
        columnaOrigen={record.columnaOrigen}
        valorRaw={record.valorRaw}
        mode="view"
        onChange={() => {
          /* no-op en modo view */
        }}
      />

      {record.motivo ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Razón del rechazo
          </h3>
          <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
            {record.motivo}
          </p>
        </div>
      ) : null}
    </section>
  );
}
