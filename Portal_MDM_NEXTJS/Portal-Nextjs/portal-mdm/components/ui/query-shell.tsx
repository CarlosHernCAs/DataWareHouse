"use client";

import * as React from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { ErrorPanel } from "@/components/ui/error-panel";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * `QueryShell` — adapter declarativo para el patrón
 * `isLoading | error | empty | data` que se repetía 20+ veces en
 * dashboard cards.
 *
 * - Si `query.error`: muestra `<ErrorPanel>` con `refetch` como retry.
 * - Si `query.isLoading && !query.data`: muestra el skeleton.
 * - Si la data llegó pero `isEmpty(data)` → renderiza el slot `empty`
 *   (opcional, si no se pasa el componente renderiza children con la
 *   data igual y deja la decisión "vacío vs no" al hijo).
 * - Si todo OK: invoca `children(data)`.
 *
 * El cuerpo del card no necesita más boilerplate de loading/error.
 */
interface QueryShellProps<T> {
  query: UseQueryResult<T>;
  /** Render del estado loading. Default: `<Skeleton className="h-24 w-full" />`. */
  skeleton?: React.ReactNode;
  /** Render del estado empty (cuando `isEmpty(data) === true`). */
  empty?: React.ReactNode;
  /** Predicado opcional para "vacío". Default: array vacío o null/undefined. */
  isEmpty?: (data: T) => boolean;
  children: (data: T) => React.ReactNode;
}

const DEFAULT_SKELETON = <Skeleton className="h-24 w-full rounded-md" />;

function defaultIsEmpty<T>(data: T): boolean {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  return false;
}

export function QueryShell<T>({
  query,
  skeleton = DEFAULT_SKELETON,
  empty,
  isEmpty = defaultIsEmpty,
  children,
}: QueryShellProps<T>) {
  if (query.error) {
    const msg =
      query.error instanceof Error
        ? query.error.message
        : String(query.error);
    return <ErrorPanel message={msg} onRetry={() => query.refetch()} />;
  }
  if (query.isLoading && query.data === undefined) {
    return <>{skeleton}</>;
  }
  if (query.data === undefined) return null;
  if (empty != null && isEmpty(query.data)) {
    return <>{empty}</>;
  }
  return <>{children(query.data)}</>;
}
