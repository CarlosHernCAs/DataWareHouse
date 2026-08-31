import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireApiSession } from "@/lib/auth/require-api-role";
import { JWT_COOKIE_NAME } from "@/lib/auth/session";
import { getPendingHomologations } from "@/lib/api/homologation";

export const dynamic = "force-dynamic";

/**
 * GET /api/cc/quality/homologaciones
 * ==================================
 * Homologaciones pendientes para consumo en CLIENTE (compositor Hypr).
 *
 * Reutiliza `getPendingHomologations`, el mismo fetch+map que usa el server
 * component de Calidad, para que la ventana de Calidad del compositor pueda
 * poblar la pestaña Homologación sin depender de datos inyectados por el server.
 */
export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  try {
    const token = (await cookies()).get(JWT_COOKIE_NAME)?.value;
    const homologaciones = await getPendingHomologations(token);
    return NextResponse.json(homologaciones);
  } catch {
    return NextResponse.json(
      { detail: "No se pudieron cargar las homologaciones." },
      { status: 502 },
    );
  }
}
