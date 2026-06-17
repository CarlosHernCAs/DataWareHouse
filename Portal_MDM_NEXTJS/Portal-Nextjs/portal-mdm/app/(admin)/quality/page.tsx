// app/(admin)/quality/page.tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/ui/page-header";
import { getQuarantineRecords } from "@/lib/api/quarantine";
import { JWT_COOKIE_NAME, getSession } from "@/lib/auth/session";
import { getPendingHomologations, getReinjectionStats } from "@/lib/api/homologation";
import { QualityShell } from "./quality-shell";

export const metadata: Metadata = { title: "Gobierno y Calidad de Datos" };

export default async function QualityPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME)?.value;
  const session = await getSession();

  const [quarantineRes, pendingHomologations, reinjectionData] = await Promise.all([
    getQuarantineRecords(1, 100, token),
    getPendingHomologations(token),
    getReinjectionStats(token),
  ]);

  const quarantineData = quarantineRes.datos;
  const totalQuarantine = quarantineRes.total;
  const reinyeccionCount = reinjectionData?.candidatos || 0;
  const pendingQuarantine = quarantineData.filter(
    (d) => d.estado.toUpperCase() === "PENDIENTE",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gobierno y Calidad de Datos"
        description="Monitor de salud, cuarentena, homologación interactiva y reinyección de datos."
      />
      <QualityShell
        cuarentenaTotal={totalQuarantine}
        cuarentenaPendiente={pendingQuarantine}
        reinyeccionCount={reinyeccionCount}
        initialQuarantineData={quarantineData}
        pendingHomologations={pendingHomologations}
        isReadOnly={session?.role === "analyst"}
      />
    </div>
  );
}
