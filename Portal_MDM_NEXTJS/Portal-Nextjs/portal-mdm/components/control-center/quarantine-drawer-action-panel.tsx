"use client";

import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { QuarantineRecord } from "@/lib/schemas/quality";
import { QuarantineCompositeEditor } from "@/components/control-center/quarantine-composite-editor";
import { ModeRadio } from "./quarantine-drawer-primitives";
import type { QuarantineDrawerState } from "./use-quarantine-drawer";

interface QuarantineActionPanelProps {
  record: QuarantineRecord;
  state: QuarantineDrawerState;
  onClose: () => void;
}

/**
 * Columna derecha del modal de cuarentena.
 *
 * Contiene el selector de modo (resolve / reject), los campos del
 * formulario correspondientes al modo activo, los banners de alerta y
 * los botones de acción. No gestiona mutaciones directamente — recibe el
 * estado completo desde `useQuarantineDrawer` vía la prop `state`.
 */
export function QuarantineActionPanel({
  record,
  state,
  onClose,
}: QuarantineActionPanelProps) {
  const {
    mode,
    setMode,
    setEditedValues,
    comentario,
    setComentario,
    motivo,
    setMotivo,
    confirmReject,
    setConfirmReject,
    mutationError,
    clearMutationError,
    pending,
    canSubmit,
  } = state;

  return (
    <section
      aria-label="Acción a aplicar"
      className="flex min-h-0 flex-col gap-4 overflow-y-auto px-6 py-5"
    >
      <fieldset
        aria-label="Tipo de acción"
        className="flex flex-col gap-2"
        disabled={pending}
      >
        <legend className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Decisión MDM
        </legend>
        <ModeRadio
          active={mode === "resolve"}
          onClick={() => {
            setMode("resolve");
            setConfirmReject(false);
            clearMutationError();
          }}
          icon={<CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />}
          title="Resolver con valor canónico"
          description="Marca como RESUELTO y guarda el valor homologado para futuras lecturas."
        />
        <ModeRadio
          active={mode === "reject"}
          onClick={() => {
            setMode("reject");
            clearMutationError();
          }}
          icon={<XCircle className="h-4 w-4 text-[var(--color-destructive)]" />}
          title="Rechazar"
          description="Descarta el registro. No se reintegra al DWH."
        />
      </fieldset>

      {mode === "resolve" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>
              Valor canónico{" "}
              <span aria-hidden className="text-[var(--color-destructive)]">
                *
              </span>
            </Label>
            <QuarantineCompositeEditor
              key={`edit-${record.tablaOrigen}-${record.idRegistro}`}
              columnaOrigen={record.columnaOrigen}
              valorRaw={record.valorRaw}
              mode="edit"
              onChange={setEditedValues}
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Edita los campos que necesiten corregirse. El sistema
              re-ensambla el valor que se guardará. Máx. 200 caracteres en
              total.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comentario">Comentario (opcional)</Label>
            <textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Notas para auditoría"
              className="bg-surface min-h-[96px] w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="motivo">
            Motivo del descarte{" "}
            <span aria-hidden className="text-[var(--color-destructive)]">
              *
            </span>
          </Label>
          <textarea
            id="motivo"
            autoFocus
            required
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              setConfirmReject(false);
            }}
            maxLength={500}
            rows={5}
            placeholder="Explica por qué el registro no debe ser homologado"
            className="bg-surface w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-60"
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Queda registrado en auditoría con tu usuario. Máx. 500 caracteres.
          </p>
        </div>
      )}

      {mutationError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-[color-mix(in_oklab,var(--color-destructive)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,transparent)] px-3 py-2 text-xs text-[var(--color-destructive)]"
        >
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{mutationError}</span>
        </div>
      ) : null}

      {mode === "reject" && confirmReject && !mutationError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-[color-mix(in_oklab,var(--color-warning)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_10%,transparent)] px-3 py-2 text-xs text-[var(--color-warning)]"
        >
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Vas a descartar este registro. La acción queda auditada y no se
            puede deshacer desde la UI. Presiona{" "}
            <strong>Confirmar descarte</strong> para continuar.
          </span>
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-end gap-2 border-t border-[var(--color-border)] pt-4">
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant={mode === "reject" ? "destructive" : "primary"}
          disabled={!canSubmit}
          aria-busy={pending}
        >
          {pending ? (
            <>
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              Aplicando…
            </>
          ) : mode === "reject" ? (
            confirmReject ? "Confirmar descarte" : "Rechazar"
          ) : (
            "Resolver"
          )}
        </Button>
      </div>
    </section>
  );
}
