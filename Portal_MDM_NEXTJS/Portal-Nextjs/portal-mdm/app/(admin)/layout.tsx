import { requireAnyRole } from "@/lib/auth/require-role";
import { AdminShellSwitcher } from "@/components/hypr/admin-shell-switcher";
import { buildNavGroups } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAnyRole(["admin", "analyst"]);
  const navItems = buildNavGroups(session.role).flatMap((g) => g.items);

  // El switcher decide en cliente: compositor Hypr (admin + desktop + pref) o
  // RoleShell clásico (analista, móvil o modo clásico).
  return (
    <AdminShellSwitcher
      role={session.role}
      userName={session.name ?? session.username}
      navItems={navItems}
    >
      {children}
    </AdminShellSwitcher>
  );
}
