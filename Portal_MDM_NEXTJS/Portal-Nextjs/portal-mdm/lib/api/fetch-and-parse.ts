/**
 * lib/api/fetch-and-parse.ts
 * ==========================
 * Helpers cliente para los route handlers locales `/api/cc/*` y
 * `/api/analyst/*`. Centralizan tres preocupaciones que antes vivían
 * duplicadas en 5+ hooks:
 *
 *  1. Credenciales (`credentials: "include"`) + `cache: "no-store"`.
 *  2. 401 → `dispatchSessionExpired()` + `UnauthorizedError` para que el
 *     handler global haga el logout, sin que cada hook tenga que repetir
 *     el patrón.
 *  3. Parseo del cuerpo de error tipo `{ detail: string }` que emite
 *     FastAPI, con fallback al `statusText`.
 *
 * No confundir con `lib/api/client.ts::apiFetch`, que vive en el server
 * y habla directo al FastAPI usando `NEXT_PUBLIC_API_URL` + Bearer token.
 */

import type { z } from "zod";
import { dispatchSessionExpired } from "./session-events";
import { HttpError, UnauthorizedError } from "./errors";

interface FetchOptions extends RequestInit {
  /**
   * Si true, NO dispara `dispatchSessionExpired` al recibir 401.
   * Útil para chequeos opcionales (ej. polling de notifs en login).
   */
  skipSessionDispatch?: boolean;
}

async function extractDetail(res: Response): Promise<string> {
  let detail = res.statusText;
  try {
    const body = await res.json();
    if (body && typeof body === "object" && "detail" in body) {
      detail = String((body as { detail: unknown }).detail);
    }
  } catch {
    /* respuesta sin body JSON — usamos statusText */
  }
  return detail;
}

async function rawFetch(path: string, opts: FetchOptions = {}): Promise<Response> {
  const { skipSessionDispatch, ...init } = opts;
  const res = await fetch(path, {
    credentials: "include",
    cache: "no-store",
    ...init,
  });
  if (res.status === 401) {
    if (!skipSessionDispatch) dispatchSessionExpired();
    throw new UnauthorizedError(path);
  }
  return res;
}

/**
 * GET (o cualquier método) + parse con schema Zod.
 * Lanza `UnauthorizedError` en 401 y `HttpError` con `.status` en otros errores.
 */
export async function fetchAndParse<T>(
  path: string,
  schema: z.ZodType<T>,
  opts?: FetchOptions,
): Promise<T> {
  const res = await rawFetch(path, opts);
  if (!res.ok) {
    throw new HttpError(res.status, `${path} → ${res.status}: ${await extractDetail(res)}`);
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new HttpError(
      res.status,
      `Respuesta del servidor no es JSON válido (status ${res.status}). Verifica que el backend esté corriendo.`,
    );
  }
  return schema.parse(data);
}

/**
 * Como `fetchAndParse` pero sin parsear el cuerpo — útil para mutaciones
 * cuyo único valor de retorno es "ok / no ok".
 */
export async function fetchOk(path: string, opts?: FetchOptions): Promise<void> {
  const res = await rawFetch(path, opts);
  if (!res.ok) {
    throw new HttpError(res.status, `${path} → ${res.status}: ${await extractDetail(res)}`);
  }
}

/**
 * Como `fetchAndParse` pero devuelve el JSON raw sin schema. Solo usar
 * cuando la respuesta no tiene shape estable (ej. forwards del backend
 * que ya validó). En lo posible, prefiere `fetchAndParse` con un schema.
 */
export async function fetchJson<T = unknown>(
  path: string,
  opts?: FetchOptions,
): Promise<T> {
  const res = await rawFetch(path, opts);
  if (!res.ok) {
    throw new HttpError(res.status, `${path} → ${res.status}: ${await extractDetail(res)}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export { HttpError, UnauthorizedError, isApiError, isHttpStatus } from "./errors";
