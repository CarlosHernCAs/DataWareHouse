import { requireApiSession } from "@/lib/auth/require-api-role";
import { cookies } from "next/headers";
import { JWT_COOKIE_NAME } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, ctx: Ctx) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await ctx.params;
  const store = await cookies();
  const token = store.get(JWT_COOKIE_NAME)?.value;

  try {
    const res = await fetch(`${API_URL}/api/v1/etl/corridas/${encodeURIComponent(id)}/eventos`, {
      headers: {
        accept: "text/event-stream",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok || !res.body) {
      return new Response(JSON.stringify({ detail: "Failed to connect to SSE stream" }), { status: res.status });
    }

    return new Response(res.body, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ detail: err instanceof Error ? err.message : String(err) }), { status: 502 });
  }
}
