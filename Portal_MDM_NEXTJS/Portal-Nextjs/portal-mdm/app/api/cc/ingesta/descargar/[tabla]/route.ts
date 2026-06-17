import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { JWT_COOKIE_NAME } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tabla: string }> }
) {
  try {
    const { tabla } = await params;
    const store = await cookies();
    const token = store.get(JWT_COOKIE_NAME)?.value;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${apiUrl}/api/v1/ingesta/descargar/${tabla}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Error desde FastAPI: ${response.status}`, detail: errorText },
        { status: response.status }
      );
    }

    // Stream the CSV response back to the client
    const contentDisposition = response.headers.get("Content-Disposition");

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": contentDisposition || `attachment; filename=${tabla}_export.csv`,
      },
    });
  } catch (error) {
    console.error("[Descargar Tabla] Proxy error:", error);
    return NextResponse.json({ error: "Error interno del servidor proxy" }, { status: 500 });
  }
}
