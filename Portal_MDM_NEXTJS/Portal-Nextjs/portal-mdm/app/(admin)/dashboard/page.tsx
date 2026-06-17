import type { Metadata } from "next";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { DashboardData } from "./dashboard-data";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

/**
 * Server Component del dashboard admin con streaming SSR.
 *
 * El page solo valida RBAC y retorna un shell ligero envuelto en
 * `<Suspense>`. El prefetch de las 6 queries del Control Center vive
 * en `<DashboardData/>` (server component async aparte), de manera que
 * su `await` NO bloquea el TTFB.
 *
 * Flujo:
 *  1. Browser pide /dashboard → Next emite shell + PageSkeleton en <100ms.
 *  2. En el server, `prefetchDashboard` corre en paralelo.
 *  3. Cuando termina, Next streamea el HTML hidratado del Dashboard.
 *  4. React reemplaza el skeleton sin client-side hydration adicional.
 */
export default async function AdminDashboardPage() {
  await requireRole("admin");

  return (
    <Suspense fallback={<PageSkeleton template="dashboard" kpiCount={4} cardCount={6} />}>
      <DashboardData
        title="Dashboard"
        description="Estado del ecosistema de datos en tiempo casi-real."
      />
    </Suspense>
  );
}
