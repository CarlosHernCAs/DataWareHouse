import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireApiSession } from "@/lib/auth/require-api-role";
import { JWT_COOKIE_NAME } from "@/lib/auth/session";
import { getReinjectionStats } from "@/lib/api/homologation";

export const dynamic = "force-dynamic";

/**
 * GET /api/cc/reinyeccion/candidatos
 * ==================================
 * Conteo de candidatos a reinyección para consumo en CLIENTE (compositor Hypr).
 *
 * Complementa la ruta POST /api/cc/reinyeccion (ejecutar). Degrada a 0 sin
 * error para que un fallo del backend no rompa la ventana de Calidad.
 */
export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  try {
    const token = (await cookies()).get(JWT_COOKIE_NAME)?.value;
    const stats = await getReinjectionStats(token);
    return NextResponse.json({ candidatos: Number(stats?.candidatos ?? 0) });
  } catch {
    return NextResponse.json({ candidatos: 0 });
  }
}
