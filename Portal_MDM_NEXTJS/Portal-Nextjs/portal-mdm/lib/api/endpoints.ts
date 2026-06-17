/**
 * lib/api/endpoints.ts
 * ====================
 * Capa declarativa para endpoints `/api/*` del portal.
 *
 * Un endpoint se declara UNA vez con:
 *  - path (string o función si tiene params)
 *  - método HTTP
 *  - schema Zod del input (query/body) — opcional
 *  - schema Zod de la respuesta
 *
 * Y se invoca con `callEndpoint(ep, input)`. Los tipos del input y del
 * output salen inferidos del schema, sin redeclararlos.
 *
 * Ventajas frente a `fetchAndParse(url, Schema, opts)` directo:
 *  - Drift cero entre URL y schema: el match vive en un solo objeto.
 *  - El cliente no construye query strings ni serializa bodies a mano.
 *  - Test runner puede importar un solo registro y comprobar contratos.
 *
 * Adopción gradual: convive con `fetchAndParse`. Solo se usa donde se
 * declara explícitamente; no migra los 30+ hooks existentes de golpe.
 *
 * Ejemplo:
 *   const QualityByTableEndpoint = defineEndpoint({
 *     path: "/api/cc/quality/by-table",
 *     method: "GET",
 *     input: z.object({ rangoHoras: z.number().min(1).max(168) }),
 *     output: z.array(QualityByTable),
 *   });
 *
 *   const data = await callEndpoint(QualityByTableEndpoint, { rangoHoras: 24 });
 */

import { z, type ZodType } from "zod";
import { fetchAndParse } from "./fetch-and-parse";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface EndpointDef<Input, Output> {
  /**
   * Ruta del endpoint. Función si depende de input (ej. params de URL),
   * string literal si es fija.
   */
  path: string | ((input: Input) => string);
  method: HttpMethod;
  /** Schema del input. Si se omite, el endpoint no toma argumentos. */
  input?: ZodType<Input>;
  /** Schema de la respuesta. SIEMPRE requerido para forzar el parse. */
  output: ZodType<Output>;
  /**
   * En métodos con body (POST/PATCH/PUT), transforma el input al JSON
   * que se envía. Default: el input tal cual.
   * Para GET con query params, ver `toQuery`.
   */
  toBody?: (input: Input) => unknown;
  /**
   * En GET, transforma el input a `Record<string, string>` para query
   * string. Default: cada key del input como `String(value)`. Solo los
   * valores no-null/undefined se incluyen.
   */
  toQuery?: (input: Input) => Record<string, string | undefined>;
}

/**
 * Helper identity para preservar la inferencia de tipos al declarar
 * un endpoint. Permite escribir `defineEndpoint({ ... })` sin tener
 * que repetir parámetros genéricos.
 */
export function defineEndpoint<I, O>(def: EndpointDef<I, O>): EndpointDef<I, O> {
  return def;
}

function buildQueryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

function defaultToQuery<I>(input: I): Record<string, string | undefined> {
  if (input == null || typeof input !== "object") return {};
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (v == null) continue;
    out[k] = String(v);
  }
  return out;
}

/**
 * Invoca un endpoint declarado con `defineEndpoint`. Valida el input
 * (si hay schema) antes de llamar, y la respuesta contra `output` vía
 * `fetchAndParse`.
 *
 * Errores:
 *  - `ZodError` si el input no cumple el schema (bug del caller).
 *  - `UnauthorizedError` en 401 (mismo handling que fetchAndParse).
 *  - `HttpError` en otros errores HTTP.
 */
export async function callEndpoint<I, O>(
  ep: EndpointDef<I, O>,
  input: I,
): Promise<O> {
  // Validar input — falla rápido si el caller pasa algo inválido.
  if (ep.input) ep.input.parse(input);

  const basePath = typeof ep.path === "function" ? ep.path(input) : ep.path;
  let url = basePath;
  const init: RequestInit = { method: ep.method };

  if (ep.method === "GET" || ep.method === "DELETE") {
    const q = ep.toQuery ? ep.toQuery(input) : defaultToQuery(input);
    url = basePath + buildQueryString(q);
  } else {
    const body = ep.toBody ? ep.toBody(input) : input;
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }

  return fetchAndParse(url, ep.output, init);
}

/**
 * Variante de `callEndpoint` para endpoints SIN input. Hace el TypeScript
 * más limpio en hooks: `useQuery({ queryFn: () => callEndpointNoArgs(ep) })`.
 */
export async function callEndpointNoArgs<O>(
  ep: EndpointDef<void, O>,
): Promise<O> {
  return callEndpoint(ep, undefined as void);
}

// Re-export común para no obligar a importar zod por separado en
// archivos que solo declaran endpoints.
export { z };
