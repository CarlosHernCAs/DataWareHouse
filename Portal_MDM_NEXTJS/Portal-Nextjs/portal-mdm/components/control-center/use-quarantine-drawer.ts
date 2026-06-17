"use client";

import { useMemo, useState } from "react";
import {
  useRejectQuarantine,
  useResolveQuarantine,
} from "@/hooks/use-quality";
import { useToast } from "@/hooks/use-toast";
import {
  assembleComposite,
  parseComposite,
} from "@/lib/quarantine/parse-composite";
import type { QuarantineRecord } from "@/lib/schemas/quality";

export type Mode = "resolve" | "reject";

export interface QuarantineDrawerState {
  mode: Mode;
  setMode: (m: Mode) => void;
  editedValues: string[];
  setEditedValues: (v: string[]) => void;
  comentario: string;
  setComentario: (v: string) => void;
  motivo: string;
  setMotivo: (v: string) => void;
  confirmReject: boolean;
  setConfirmReject: (v: boolean) => void;
  mutationError: string | null;
  clearMutationError: () => void;
  pending: boolean;
  canSubmit: boolean;
  valorCanonico: string;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

/**
 * Encapsula todo el estado de formulario y las mutaciones resolve/reject
 * para el drawer de cuarentena. Se mantiene en el mismo directorio porque
 * es exclusivo de este componente.
 */
export function useQuarantineDrawer(
  record: QuarantineRecord,
  onClose: () => void,
): QuarantineDrawerState {
  const parsed = useMemo(
    () => parseComposite(record.columnaOrigen, record.valorRaw),
    [record.columnaOrigen, record.valorRaw],
  );

  const [mode, setMode] = useState<Mode>("resolve");
  const [editedValues, setEditedValues] = useState<string[]>(() =>
    parsed.kind === "composite"
      ? parsed.fields.map((f) => f.raw)
      : [parsed.rawFallback ?? record.valorRaw],
  );
  const [comentario, setComentario] = useState("");
  const [motivo, setMotivo] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const resolveMutation = useResolveQuarantine();
  const rejectMutation = useRejectQuarantine();
  const { toast } = useToast();

  const pending = resolveMutation.isPending || rejectMutation.isPending;
  const valorCanonico = assembleComposite(parsed, editedValues);
  const canSubmit =
    mode === "resolve"
      ? valorCanonico.trim().length > 0 && !pending
      : motivo.trim().length > 0 && !pending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setMutationError(null);

    if (mode === "reject" && !confirmReject) {
      setConfirmReject(true);
      return;
    }

    const onSuccess = (msg: string) => {
      toast({ variant: "success", title: msg });
      onClose();
    };
    const onError = (err: unknown) => {
      const m = err instanceof Error ? err.message : String(err);
      setMutationError(m);
      toast({ variant: "destructive", title: "No se pudo aplicar", description: m });
    };

    if (mode === "resolve") {
      resolveMutation.mutate(
        {
          tabla: record.tablaOrigen,
          id: record.idRegistro,
          valorCanonico: valorCanonico.trim(),
          comentario: comentario.trim() || null,
        },
        {
          onSuccess: () => onSuccess(`Registro #${record.idRegistro} resuelto`),
          onError,
        },
      );
    } else {
      rejectMutation.mutate(
        {
          tabla: record.tablaOrigen,
          id: record.idRegistro,
          motivo: motivo.trim(),
        },
        {
          onSuccess: () => onSuccess(`Registro #${record.idRegistro} descartado`),
          onError,
        },
      );
    }
  }

  return {
    mode,
    setMode,
    editedValues,
    setEditedValues,
    comentario,
    setComentario,
    motivo,
    setMotivo,
    confirmReject,
    setConfirmReject,
    mutationError,
    clearMutationError: () => setMutationError(null),
    pending,
    canSubmit,
    valorCanonico,
    handleSubmit,
  };
}
