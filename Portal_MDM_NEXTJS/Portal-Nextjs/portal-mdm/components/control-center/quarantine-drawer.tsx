"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useId } from "react";
import { X } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { QuarantineRecord } from "@/lib/schemas/quality";

import { useQuarantineDrawer } from "./use-quarantine-drawer";
import { QuarantineContextPanel } from "./quarantine-drawer-context-panel";
import { QuarantineActionPanel } from "./quarantine-drawer-action-panel";

interface QuarantineDrawerProps {
  record: QuarantineRecord | null;
  onClose: () => void;
}

/**
 * Modal centrado de cuarentena.
 *
 * Antes era un drawer lateral 400px — el operador no veía el contexto
 * y la acción al mismo tiempo. Ahora es un modal de 2 columnas
 * (lg: lado a lado, mobile: stack) donde:
 *
 *   - Columna izquierda: contexto del registro (origen, valor recibido,
 *     motivo del rechazo). Lectura.
 *   - Columna derecha: acción a aplicar (resolver con valor canónico,
 *     o rechazar con motivo). Decisión.
 *
 * El componente sigue llamándose `QuarantineDrawer` para no romper el
 * import en `quality-client.tsx`.
 */
export function QuarantineDrawer({ record, onClose }: QuarantineDrawerProps) {
  const open = record !== null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/65 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-[min(960px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)]",
            "flex flex-col overflow-hidden",
            "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          {record ? (
            <ModalBody
              key={`${record.tablaOrigen}::${record.idRegistro}`}
              record={record}
              onClose={onClose}
            />
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* -------------------------------------------------------------------------- */

interface ModalBodyProps {
  record: QuarantineRecord;
  onClose: () => void;
}

function ModalBody({ record, onClose }: ModalBodyProps) {
  const headingId = useId();
  const descId = useId();
  const state = useQuarantineDrawer(record, onClose);

  return (
    <>
      <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <DialogPrimitive.Title
            id={headingId}
            className="text-lg font-semibold leading-none tracking-tight text-[var(--color-text)]"
          >
            Registro en cuarentena
          </DialogPrimitive.Title>
          <DialogPrimitive.Description
            id={descId}
            className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]"
          >
            <span className="font-mono">#{record.idRegistro}</span>
            <span aria-hidden>·</span>
            <StatusBadge
              tone="warning"
              label={record.estado}
              variant="pill"
              size="sm"
            />
          </DialogPrimitive.Description>
        </div>
        <DialogPrimitive.Close
          aria-label="Cerrar"
          className="rounded-sm p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </header>

      <form
        onSubmit={state.handleSubmit}
        className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_1.05fr]"
      >
        <QuarantineContextPanel record={record} />
        <QuarantineActionPanel record={record} state={state} onClose={onClose} />
      </form>
    </>
  );
}
