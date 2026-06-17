/**
 * Registro tipado de endpoints `/api/cc/quality/*`.
 *
 * Sirve como ejemplo de adopción del patrón `defineEndpoint`. Los hooks
 * existentes en `hooks/use-quality.ts` siguen funcionando con
 * `fetchAndParse` directo; este registro es opcional y se puede
 * adoptar incrementalmente.
 *
 * Para usar:
 *   import { QualityKpisEp } from "@/lib/api/endpoints/quality";
 *   const data = await callEndpointNoArgs(QualityKpisEp);
 */

import { z } from "zod";
import {
  QualityKpis,
  QualityByTable,
  QuarantinePage,
  QuarantineActionResult,
} from "@/lib/schemas/quality";
import { defineEndpoint } from "../endpoints";

/** GET /api/cc/quality — KPIs agregados de calidad. Sin input. */
export const QualityKpisEp = defineEndpoint({
  path: "/api/cc/quality",
  method: "GET",
  output: QualityKpis,
});

/** GET /api/cc/quality/by-table?rangoHoras=24 */
export const QualityByTableEp = defineEndpoint({
  path: "/api/cc/quality/by-table",
  method: "GET",
  input: z.object({
    rangoHoras: z.number().int().min(1).max(168).default(24),
  }),
  output: z.array(QualityByTable),
});

/** GET /api/cc/quality/list?pagina=&tamano=&tabla= */
export const QuarantineListEp = defineEndpoint({
  path: "/api/cc/quality/list",
  method: "GET",
  input: z.object({
    pagina: z.number().int().min(1),
    tamano: z.number().int().min(1).max(200),
    tabla: z.string().nullable().optional(),
  }),
  output: QuarantinePage,
});

/**
 * PATCH /api/cc/quality/:tabla/:id/resolver
 * El path es función porque depende de input.
 */
export const ResolveQuarantineEp = defineEndpoint({
  path: ({ tabla, id }) =>
    `/api/cc/quality/${encodeURIComponent(tabla)}/${encodeURIComponent(id)}/resolver`,
  method: "PATCH",
  input: z.object({
    tabla: z.string().min(1),
    id: z.string().min(1),
    valorCanonico: z.string().min(1),
    comentario: z.string().nullable().optional(),
  }),
  // Solo viajan los campos del body, no `tabla`/`id` que ya están en la URL.
  toBody: ({ valorCanonico, comentario }) => ({ valorCanonico, comentario }),
  output: QuarantineActionResult,
});

/** PATCH /api/cc/quality/:tabla/:id/rechazar */
export const RejectQuarantineEp = defineEndpoint({
  path: ({ tabla, id }) =>
    `/api/cc/quality/${encodeURIComponent(tabla)}/${encodeURIComponent(id)}/rechazar`,
  method: "PATCH",
  input: z.object({
    tabla: z.string().min(1),
    id: z.string().min(1),
    motivo: z.string().min(1),
  }),
  toBody: ({ motivo }) => ({ motivo }),
  output: QuarantineActionResult,
});
