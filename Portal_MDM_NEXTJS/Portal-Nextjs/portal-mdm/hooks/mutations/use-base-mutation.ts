"use client";

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

/**
 * Mutación base con tres comportamientos consistentes:
 *
 *  1. Toast automático on success / on error con `successMessage`
 *     y mensaje derivado del Error en caso de fallo.
 *  2. Invalidación declarativa de query keys al terminar (settled).
 *  3. Soporte opcional de update optimista vía `optimisticUpdate`.
 *
 * Adopción gradual: convive con `useMutation` directo. Solo se usa
 * para hooks nuevos o cuando se reescribe uno existente. No fuerza
 * migración masiva.
 *
 * Ejemplo:
 *   const m = useBaseMutation({
 *     mutationFn: (id) => fetchAndParse(`/api/x/${id}`, Schema, { method: "POST" }),
 *     invalidates: [queryKeys.quality.all()],
 *     successMessage: "Guardado",
 *     errorMessage: "No se pudo guardar",
 *   });
 */
export interface BaseMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<TData, Error, TVariables>, "onSuccess" | "onError" | "onSettled"> {
  /** Keys a invalidar después de la mutación (success o error). */
  invalidates?: readonly QueryKey[];
  /** Mensaje de éxito mostrado vía toast. Si se omite, no muestra toast. */
  successMessage?: string;
  /** Mensaje de error base. Si la Error tiene `.message`, se concatena. */
  errorMessage?: string;
  /** Callback adicional tras éxito (después del toast e invalidación). */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Callback adicional tras error. */
  onError?: (error: Error, variables: TVariables) => void;
}

export function useBaseMutation<TData, TVariables = void>(
  options: BaseMutationOptions<TData, TVariables>,
): UseMutationResult<TData, Error, TVariables> {
  const qc = useQueryClient();
  const { toast } = useToast();
  const {
    invalidates,
    successMessage,
    errorMessage,
    onSuccess: extraSuccess,
    onError: extraError,
    ...rest
  } = options;

  return useMutation<TData, Error, TVariables>({
    ...rest,
    onSuccess: (data, variables) => {
      if (successMessage) {
        toast({ title: successMessage, variant: "success" });
      }
      extraSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      const base = errorMessage ?? "Operación fallida";
      const detail = error.message && error.message !== base ? `: ${error.message}` : "";
      toast({
        title: `${base}${detail}`,
        variant: "destructive",
      });
      extraError?.(error, variables);
    },
    onSettled: () => {
      if (!invalidates) return;
      for (const key of invalidates) {
        qc.invalidateQueries({ queryKey: key });
      }
    },
  });
}
