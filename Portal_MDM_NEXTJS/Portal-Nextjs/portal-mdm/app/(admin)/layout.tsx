import { requireAnyRole } from "@/lib/auth/require-role";
import { RoleShell } from "@/components/layout/role-shell";
import { buildNavGroups } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAnyRole(["admin", "analyst"]);
  const navItems = buildNavGroups(session.role).flatMap((g) => g.items);

  return (
    <RoleShell role={session.role} userName={session.name ?? session.username} navItems={navItems}>
      {children}
    </RoleShell>
  );
}
