export type Role = "analyst" | "admin" | "executive";

export const ROLES: Role[] = ["analyst", "admin", "executive"];

/**
 * RBAC se deriva de `lib/routes.ts::ROUTES`. Cada `RouteDef` ya declara
 * `roles`, así que agregar/quitar una ruta o cambiar sus roles allí
 * actualiza automáticamente los prefijos permitidos por rol. No declares
 * el ACL manualmente aquí.
 *
 * Import runtime válido: `routes.ts` importa `Role` con `import type`
 * (borrado en build) — sin ciclo en runtime.
 */
import { ROUTE_LIST } from "@/lib/routes";

export const ROLE_ALLOWED_PREFIXES: Record<Role, string[]> = {
  analyst:   ROUTE_LIST.filter((r) => r.roles.includes("analyst")).map((r) => r.path),
  admin:     ROUTE_LIST.filter((r) => r.roles.includes("admin")).map((r) => r.path),
  executive: ROUTE_LIST.filter((r) => r.roles.includes("executive")).map((r) => r.path),
};

export const ROLE_HOME: Record<Role, string> = {
  analyst:   "/home",
  admin:     "/dashboard",
  executive: "/overview",
};

/** Rutas disponibles para cualquier usuario autenticado (sin importar rol). */
export const SHARED_AUTHENTICATED_PREFIXES = [
  "/api/auth/logout",
  "/api/cc",
  // BFF del analista: los route handlers ya hacen requireApiRole("analyst")
  // internamente. Sin este prefijo el proxy redirige las llamadas fetch a
  // /home (HTML) y el workspace/widgets/notificaciones quedan vacíos.
  "/api/analyst",
];

/** Rutas públicas (sin auth). */
export const PUBLIC_PREFIXES = ["/login", "/api/auth/login"];

export function isRoleAllowed(role: Role, pathname: string): boolean {
  if (SHARED_AUTHENTICATED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return true;
  }
  return ROLE_ALLOWED_PREFIXES[role].some((p) => pathname.startsWith(p));
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export function isValidRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}
