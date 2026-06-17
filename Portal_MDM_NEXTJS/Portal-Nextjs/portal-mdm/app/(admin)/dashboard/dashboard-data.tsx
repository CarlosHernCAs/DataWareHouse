import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { Dashboard } from "@/components/control-center/dashboard";
import { prefetchDashboard } from "@/lib/control-center/dashboard-prefetch";

/**
 * Server Component async — aislado para que su `await` no bloquee el
 * primer paint del page. El page envuelve este componente en
 * `<Suspense>`, por lo que Next emite el shell de loading al cliente
 * inmediatamente y streamea el HTML hidratado de esta zona cuando el
 * prefetch termina.
 *
 * Antes: page.tsx hacía `await prefetchDashboard()` directo → TTFB
 * arrastrado por la query más lenta (hasta 1500ms del timeout).
 * Ahora: page.tsx sale en <100ms con skeleton; este chunk llega
 * después por streaming HTTP cuando esté listo.
 */
export async function DashboardData({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const qc = new QueryClient();
  await prefetchDashboard(qc);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Dashboard title={title} description={description} />
    </HydrationBoundary>
  );
}
