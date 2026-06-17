"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  QuarantineActionResult,
  QuarantinePage,
} from "@/lib/schemas/quality";
import { fetchAndParse } from "@/lib/api/fetch-and-parse";

/**
 * Hooks de Calidad de Datos.
 *
 * Toda I/O pasa por `/api/cc/quality/*`. Mutaciones invalidan el listado
 * y los KPIs del dashboard para que ambos se mantengan consistentes.
 */

const KEY_LIST = ["cc", "quarantine-list"] as const;
const KEY_KPIS = ["cc", "quality"] as const;

/**
 * Toda mutación de cuarentena invalida los mismos dos caches: el listado
 * y los KPIs del dashboard. Helper único para no repetir el `onSuccess`
 * en cada hook nuevo.
 */
function invalidateQualityCache(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: KEY_LIST });
  qc.invalidateQueries({ queryKey: KEY_KPIS });
}

/**
 * Factory para las mutaciones tipo PATCH `/quality/{tabla}/{id}/{action}`.
 * Centraliza la URL, el verbo HTTP, el schema de respuesta y el patrón
 * de invalidación. Los hooks concretos solo declaran su input y cómo
 * convertirlo en body.
 */
function useQuarantineAction<TInput extends { tabla: string; id: string }>(
  action: string,
  toBody: (input: TInput) => unknown,
): UseMutationResult<QuarantineActionResult, Error, TInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) =>
      fetchAndParse(
        `/api/cc/quality/${encodeURIComponent(input.tabla)}/${encodeURIComponent(input.id)}/${action}`,
        QuarantineActionResult,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(toBody(input)),
        },
      ),
    onSuccess: () => invalidateQualityCache(qc),
  });
}

export interface QuarantineListParams {
  pagina: number;
  tamano: number;
  tabla?: string | null;
}

export function useQuarantineList(
  params: QuarantineListParams,
): UseQueryResult<QuarantinePage> {
  const { pagina, tamano, tabla } = params;
  return useQuery({
    queryKey: [...KEY_LIST, pagina, tamano, tabla ?? ""],
    queryFn: () => {
      const qs = new URLSearchParams({
        pagina: String(pagina),
        tamano: String(tamano),
      });
      if (tabla) qs.set("tabla", tabla);
      return fetchAndParse(
        `/api/cc/quality/list?${qs.toString()}`,
        QuarantinePage,
      );
    },
    placeholderData: (prev) => prev,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export interface ResolveInput {
  tabla: string;
  id: string;
  valorCanonico: string;
  comentario?: string | null;
}

export function useResolveQuarantine(): UseMutationResult<
  QuarantineActionResult,
  Error,
  ResolveInput
> {
  return useQuarantineAction<ResolveInput>("resolver", ({ valorCanonico, comentario }) => ({
    valorCanonico,
    comentario,
  }));
}

export interface RejectInput {
  tabla: string;
  id: string;
  motivo: string;
}

export function useRejectQuarantine(): UseMutationResult<
  QuarantineActionResult,
  Error,
  RejectInput
> {
  return useQuarantineAction<RejectInput>("rechazar", ({ motivo }) => ({ motivo }));
}
