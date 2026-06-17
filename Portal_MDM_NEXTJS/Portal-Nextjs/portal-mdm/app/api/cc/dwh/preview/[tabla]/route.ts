import { NextResponse } from "next/server";
import { fastapiFetchSafe } from "@/lib/api/server-fetch";
import { requireApiSession } from "@/lib/auth/require-api-role";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tabla: string }> | { tabla: string } },
) {
  const { error } = await requireApiSession();
  if (error) return error;

  // Next.js 15 requires awaiting params
  const { tabla } = await params;

  try {
    const data = await fastapiFetchSafe<unknown>(`/api/v1/etl/preview/${tabla}`);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
