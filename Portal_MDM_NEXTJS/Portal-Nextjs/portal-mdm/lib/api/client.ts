/**
 * Thin fetch wrapper for the FastAPI backend.
 * - Server-side: forwards the JWT cookie automatically.
 * - Client-side: relies on the httpOnly cookie set at /api/auth/login.
 *
 * Para tipos de error usa `@/lib/api/errors` — `ApiError` se re-exporta
 * desde acá por compat histórica con callers que ya hacen `instanceof`.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export { ApiError, isApiError } from "./errors";
import { ApiError } from "./errors";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: Json;
  /** Forwarded JWT (server-side calls). Client calls leave undefined. */
  token?: string;
}

/**
 * Thin fetch wrapper — realiza la llamada al backend FastAPI y devuelve el JSON parseado.
 *
 * @returns La respuesta JSON parseada. **El caller es responsable de validar
 * el shape con Zod u otro schema validator antes de confiar en los datos.**
 * Ejemplo: `const data = mySchema.parse(await apiFetch<unknown>(...))`.
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: rest.cache ?? "no-store",
  });

  const text = await res.text();
  const parsed: unknown = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (parsed && typeof parsed === "object" && "detail" in parsed
        ? String((parsed as { detail: unknown }).detail)
        : res.statusText) || "Request failed";
    throw new ApiError(res.status, message, parsed);
  }

  // 204 No Content es válido — algunos endpoints no devuelven cuerpo
  if (res.status === 204) return undefined as T;

  // Guard: respuesta 2xx con cuerpo vacío inesperado → error explícito en lugar de null casteado a T
  if (parsed === null) {
    throw new ApiError(res.status, "Respuesta vacía inesperada del servidor", null);
  }

  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
