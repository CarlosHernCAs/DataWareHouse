/**
 * lib/api/errors.ts
 * =================
 * Jerarquía única de errores para todas las llamadas al backend, tanto
 * server-side (`apiFetch` en `client.ts`) como client-side (`fetchAndParse`
 * en `fetch-and-parse.ts`). Antes había tres clases con shape similar
 * (`ApiError`, `HttpError`, `Error` con `.status` ad-hoc); todas convergen
 * acá.
 *
 *  - `ApiError`         — error genérico con `status` y `body` opcional.
 *  - `HttpError`        — alias de `ApiError` que mantengo por compat
 *                         con el cliente.
 *  - `UnauthorizedError`— 401 específico; ya disparó `dispatchSessionExpired`.
 *
 * Usar los type guards (`isApiError`, `isUnauthorizedError`,
 * `isHttpStatus`) en lugar de `instanceof` — sobreviven a cross-bundle
 * cuando subimos un cliente lazy o un test.
 */

export class ApiError extends Error {
  readonly isApiError = true as const;
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export class HttpError extends ApiError {
  constructor(status: number, message: string, body: unknown = null) {
    super(status, message, body);
    this.name = "HttpError";
  }
}

export class UnauthorizedError extends ApiError {
  readonly isUnauthorized = true as const;

  constructor(path: string) {
    super(401, `Sesión expirada al consultar ${path}`, null);
    this.name = "UnauthorizedError";
  }
}


export function isApiError(err: unknown): err is ApiError {
  return (
    err instanceof ApiError ||
    (typeof err === "object" &&
      err !== null &&
      "isApiError" in err &&
      (err as { isApiError?: boolean }).isApiError === true)
  );
}

export function isUnauthorizedError(err: unknown): err is UnauthorizedError {
  return (
    err instanceof UnauthorizedError ||
    (typeof err === "object" &&
      err !== null &&
      "isUnauthorized" in err &&
      (err as { isUnauthorized?: boolean }).isUnauthorized === true)
  );
}

/**
 * Test puntual de status code. Útil en catch blocks: si esperás 404 como
 * "no existe todavía", `if (isHttpStatus(err, 404))` lee mejor que
 * `err.status === 404`.
 */
export function isHttpStatus(err: unknown, status: number): boolean {
  return isApiError(err) && err.status === status;
}
