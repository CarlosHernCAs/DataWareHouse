"use client";

import * as React from "react";
import { ErrorPanel } from "@/components/ui/error-panel";

/**
 * ErrorBoundary client-side. Captura errores lanzados durante render
 * o eventos de hijos. Complementa los `error.tsx` de Next, que solo
 * capturan errores de server components y page-level routes.
 *
 * Usar para aislar tarjetas/secciones del dashboard: si un widget
 * revienta, el resto del portal sigue funcionando.
 *
 * Ejemplo:
 *   <ErrorBoundary fallback={(reset) => <ErrorPanel ... onRetry={reset} />}>
 *     <RiskyCard />
 *   </ErrorBoundary>
 *
 * Por default usa `<ErrorPanel>` con el `.message` del error y un
 * botón que reinicia el subtree.
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Render del fallback. Recibe el error y un callback para reintentar. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** Callback de telemetría: se dispara cuando un error es capturado. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.onError?.(error, info);
    // Log mínimo — quien quiera Sentry/PostHog lo agrega vía `onError`.
    console.error("[ErrorBoundary]", error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }
    return <ErrorPanel message={error.message} onRetry={this.reset} />;
  }
}
