import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { HomeClient } from "./home-client";

export const metadata: Metadata = { title: "Mi Workspace" };
export const dynamic = "force-dynamic";

export default async function AnalystHomePage() {
  const session = await getSession();
  return <HomeClient userName={session?.name ?? session?.username} />;
}
