"use client";

import { useEffect, useState } from "react";

/**
 * Hook SSR-safe para una media query. Devuelve `false` en el servidor y en
 * el primer render del cliente (evita hydration mismatch), y se actualiza al
 * valor real tras el montaje.
 *
 * @example
 *   const esDesktop = useMediaQuery("(min-width: 1024px)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange(); // sincroniza el valor real al montar
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Atajo: ≥1024px (breakpoint `lg` de Tailwind), umbral del compositor Hypr. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
