"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { getHyprApp } from "@/lib/hypr/apps";

/**
 * Cuerpo de una ventana del mosaico: monta la app admin correspondiente a
 * `appId` (lazy) con Suspense + ErrorBoundary aislado, para que el fallo de
 * una ventana no tumbe el compositor entero.
 */
export function AppWindowPanel({ appId }: { appId: string }) {
  const app = getHyprApp(appId);

  if (!app) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-[var(--color-text-muted)]">
        Aplicación desconocida: {appId}
      </div>
    );
  }

  const App = app.Component;

  return (
    <div className="h-full overflow-auto">
      <ErrorBoundary
        fallback={(error, reset) => (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-[var(--color-destructive)]">
              La ventana &ldquo;{app.title}&rdquo; falló al renderizar.
            </p>
            <p className="max-w-md text-xs text-[var(--color-text-muted)]">
              {error.message}
            </p>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm transition hover:bg-[var(--color-surface-2)]"
            >
              Reintentar
            </button>
          </div>
        )}
      >
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center p-6 text-sm text-[var(--color-text-muted)]">
              Cargando {app.title}…
            </div>
          }
        >
          <App />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
