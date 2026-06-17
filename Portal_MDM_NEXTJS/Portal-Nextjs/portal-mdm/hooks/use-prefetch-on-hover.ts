"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

/**
 * Hook que retorna handlers `onMouseEnter` / `onFocus` para prefetchar
 * una query de TanStack en hover/focus, antes del click.
 *
 * Aplicable a `<Link>` de la sidebar, dashboard cards click-through,
 * filas de tablas que abren detalle, etc. El click se siente
 * instantáneo porque la data llega antes.
 *
 * Dedupe interno: solo dispara el prefetch UNA vez por mount (la cookie
 * de cache de TanStack se encarga del resto). Si el usuario pasa el
 * cursor 10 veces sin clickear, sigue siendo 1 request.
 *
 * Ejemplo:
 *   const prefetch = usePrefetchOnHover({
 *     queryKey: ["cc", "etl-detail", id],
 *     queryFn: () => fetchAndParse(`/api/cc/etl/runs/${id}`, CorridaDetail),
 *     staleTime: 30_000,
 *   });
 *   <Link href={`/etl-monitor/${id}`} {...prefetch}>Ver</Link>
 */
interface PrefetchOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  /** Si la cache aún es fresca, no se hace request. Default: 30s. */
  staleTime?: number;
}

export function usePrefetchOnHover<T>({
  queryKey,
  queryFn,
  staleTime = 30_000,
}: PrefetchOptions<T>) {
  const qc = useQueryClient();
  const triggered = useRef(false);

  const trigger = useCallback(() => {
    if (triggered.current) return;
    triggered.current = true;
    void qc.prefetchQuery({ queryKey, queryFn, staleTime });
  }, [qc, queryKey, queryFn, staleTime]);

  return {
    onMouseEnter: trigger,
    onFocus: trigger,
  };
}
