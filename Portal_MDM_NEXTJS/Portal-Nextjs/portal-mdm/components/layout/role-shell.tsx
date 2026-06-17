"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth/rbac";
import { findRoute } from "@/lib/routes";
import { CommandPalette } from "@/components/ui/command-palette";
import { SessionExpiredHandler } from "@/components/providers/session-expired-handler";
import { PreferenciasProvider } from "@/components/providers/preferencias-provider";
import { AlertStreamMount } from "@/components/providers/alert-stream-mount";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

interface RoleShellProps {
  role: Role;
  userName?: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

const ROLE_LABELS: Record<Role, string> = {
  analyst: "Analista",
  admin: "Administrador MDM",
  executive: "Ejecutivo",
};

function userInitial(name?: string): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

export function RoleShell({ role, userName, navItems, children }: RoleShellProps) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pageTitle = findRoute(pathname)?.label ?? "Portal MDM";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <PreferenciasProvider>
      <SessionExpiredHandler />
      <AlertStreamMount />
      <div className="bg-bg text-text grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside
        className="bg-surface hidden border-r border-[var(--color-border)] lg:flex lg:flex-col"
        aria-label={`Navegación — ${ROLE_LABELS[role]}`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-[var(--color-border)] px-5">
          <span
            aria-hidden
            className="bg-[var(--color-primary)] inline-block h-2.5 w-2.5 rounded-full"
          />
          <span className="text-sm font-semibold tracking-tight">Portal MDM</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Principal">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                  active
                    ? "bg-[var(--color-surface-2)] text-[var(--color-text)] font-medium"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <footer className="border-t border-[var(--color-border)] p-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex w-full min-h-[44px] items-center gap-2 rounded-md px-2 py-1.5 text-sm transition",
                "hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
              )}
            >
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-[var(--color-primary-foreground)]"
              >
                {userInitial(userName)}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate font-medium text-[var(--color-text)]">
                  {userName ?? "Sesión"}
                </span>
                <span className="block truncate text-xs text-[var(--color-text-muted)]">
                  {ROLE_LABELS[role]}
                </span>
              </span>
              <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-[220px]">
              <DropdownMenuLabel>{ROLE_LABELS[role]}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  const form = document.createElement("form");
                  form.method = "post";
                  form.action = "/api/auth/logout";
                  document.body.appendChild(form);
                  form.submit();
                }}
              >
                <LogOut aria-hidden className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </footer>
      </aside>

      <main id="main-content" className="flex min-h-screen flex-col min-w-0" tabIndex={-1}>
        <header className="bg-surface flex h-14 items-center justify-between gap-4 border-b border-[var(--color-border)] px-6">
          <h1 className="min-w-0 truncate text-sm font-semibold text-[var(--color-text)]">
            {pageTitle}
          </h1>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Abrir búsqueda de comandos (Ctrl o Cmd + K)"
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs text-[var(--color-text-muted)] transition",
              "hover:border-[var(--color-primary)] hover:text-[var(--color-text)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
            )}
          >
            <Search aria-hidden className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Buscar…</span>
            <kbd className="hidden rounded border border-[var(--color-border)] px-1.5 py-0.5 font-mono text-[10px] md:inline-block">
              ⌘K
            </kbd>
          </button>
        </header>
        <div className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">{children}</div>
      </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} role={role} />
    </PreferenciasProvider>
  );
}
