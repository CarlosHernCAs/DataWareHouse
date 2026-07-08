"use client";

import { PanelsTopLeft } from "lucide-react";
import type { Role } from "@/lib/auth/rbac";
import {
  PreferenciasProvider,
  usePreferencias,
} from "@/components/providers/preferencias-provider";
import { RoleShell, type NavItem } from "@/components/layout/role-shell";
import { useIsDesktop } from "@/hooks/use-media-query";
import { HyprShell } from "./hypr-shell";

interface AdminShellSwitcherProps {
  role: Role;
  userName?: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

/**
 * Elige el shell del segmento admin en cliente:
 *
 *   - Compositor **Hypr** solo si: rol `admin` + preferencia `hypr` + viewport
 *     de escritorio (≥lg). El tiling no aplica en móvil.
 *   - En cualquier otro caso (analista visitando rutas admin, móvil, o
 *     preferencia `clasico`): el `RoleShell` clásico de siempre.
 *
 * La preferencia vive en `localStorage` (cliente), por eso la decisión es
 * client-side. En SSR / primer render `useIsDesktop()` devuelve `false`, así
 * que arranca en clásico y conmuta al compositor tras montar (sin mismatch).
 */
function Switcher({ role, userName, navItems, children }: AdminShellSwitcherProps) {
  const { adminShell, setAdminShell } = usePreferencias();
  const esDesktop = useIsDesktop();

  const usarHypr = role === "admin" && adminShell === "hypr" && esDesktop;

  if (usarHypr) {
    return (
      <HyprShell
        role={role}
        userName={userName}
        onExitHypr={() => setAdminShell("clasico")}
      />
    );
  }

  return (
    <>
      <RoleShell role={role} userName={userName} navItems={navItems}>
        {children}
      </RoleShell>

      {/* Re-entrada al compositor: solo para admin en escritorio que salió al
          modo clásico. Evita que quede atrapado sin forma de volver a Hypr. */}
      {role === "admin" && esDesktop && adminShell === "clasico" && (
        <button
          type="button"
          onClick={() => setAdminShell("hypr")}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text)] shadow-lg transition hover:bg-[var(--color-surface-2)]"
          aria-label="Volver al compositor Hypr"
        >
          <PanelsTopLeft aria-hidden className="h-4 w-4" />
          Modo Hypr
        </button>
      )}
    </>
  );
}

export function AdminShellSwitcher(props: AdminShellSwitcherProps) {
  return (
    <PreferenciasProvider>
      <Switcher {...props} />
    </PreferenciasProvider>
  );
}
