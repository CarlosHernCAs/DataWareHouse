/**
 * lib/design-tokens.ts
 * ====================
 * Mapa tipado de los design tokens (CSS custom properties) declarados en
 * `app/globals.css`. Usa el helper `colorToken("primary")` en lugar de
 * escribir `var(--color-primary)` a mano — TS te avisa si nombras un
 * token que no existe.
 *
 * Tokens motion/radius/font están incluidos por completitud. Si vas a
 * declarar un token nuevo, **añadelo primero a `globals.css`** y luego
 * a la unión `ColorToken` (o el tipo correspondiente).
 *
 * NOTA: este archivo es la fuente de verdad para el tipado. La fuente
 * de verdad del valor sigue siendo `globals.css` (tema dark/light, etc).
 */

/* -------------------------------------------------------------------------- */
/* Color tokens                                                                */
/* -------------------------------------------------------------------------- */

export type ColorToken =
  // Superficies
  | "bg"
  | "surface"
  | "surface-2"
  | "border"
  | "border-strong"
  // Acción
  | "primary"
  | "primary-2"
  | "primary-foreground"
  | "primary-solid"
  | "on-primary"
  // Estado
  | "warning"
  | "warning-glow"
  | "success"
  | "success-glow"
  | "destructive"
  | "destructive-glow"
  | "info"
  | "info-glow"
  // Texto
  | "text"
  | "text-muted"
  | "text-secondary"
  // Foco
  | "ring";

/** Devuelve `var(--color-<name>)`. Type-safe sobre `ColorToken`. */
export function colorToken(name: ColorToken): string {
  return `var(--color-${name})`;
}

/**
 * Versión "tonal mix" del color: el helper devuelve un color-mix() con
 * `surface` para uso como fondo glow/tint. Útil cuando querés un fondo
 * sutil del color de estado sin definir un token aparte.
 *
 * Ejemplo: `mixWith("destructive", 12)` → un destructive al 12% sobre surface.
 */
export function mixWith(name: ColorToken, percent: number): string {
  return `color-mix(in oklab, ${colorToken(name)} ${percent}%, ${colorToken("surface")})`;
}

/* -------------------------------------------------------------------------- */
/* Radius                                                                      */
/* -------------------------------------------------------------------------- */

export type RadiusToken = "sm" | "md" | "lg";

export function radiusToken(name: RadiusToken): string {
  return `var(--radius-${name})`;
}

/* -------------------------------------------------------------------------- */
/* Motion                                                                      */
/* -------------------------------------------------------------------------- */

export type MotionDurationToken = "fast" | "base" | "slow";
export type MotionEasingToken = "out-quart";

export function motionDuration(name: MotionDurationToken): string {
  return `var(--motion-${name})`;
}

export function motionEasing(name: MotionEasingToken): string {
  return `var(--ease-${name})`;
}

/* -------------------------------------------------------------------------- */
/* Font                                                                        */
/* -------------------------------------------------------------------------- */

export type FontToken = "sans" | "mono";

export function fontToken(name: FontToken): string {
  return `var(--font-${name})`;
}
