"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/api/session-events";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Pausa polling cuando la pestaña está oculta. TanStack reanuda
            // automáticamente al volver el foco. Antes los ~6 polls del
            // dashboard seguían quemando backend con la tab en background.
            refetchIntervalInBackground: false,
            // No reintentar ante 401: el flujo de sesión expirada ya
            // dispara logout+redirect; reintentar solo añade un request inútil.
            retry: (count, error) => !isUnauthorizedError(error) && count < 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
