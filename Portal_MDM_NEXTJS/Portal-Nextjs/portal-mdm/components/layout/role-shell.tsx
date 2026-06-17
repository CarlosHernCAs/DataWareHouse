"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronDown, LogOut, Menu, Search, X } from "lucide-react";
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

/**
 * Items de navegación reutilizables — mismo render para sidebar desktop
 * y sheet móvil. Centralizar el JSX evita drift visual entre breakpoints.
 */
function NavList({
  items,
  pathname,
  onItemClick,
  onHoverPrefetch,
}: {
  items: NavItem[];
  pathname: string;
  onItemClick?: () => void;
  onHoverPrefetch: (href: string) => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Principal">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onItemClick}
            onMouseEnter={() => onHoverPrefetch(item.href)}
            onFocus={() => onHoverPrefetch(item.href)}
            className={cn(
              "relative flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm transition",
              // Indicador del activo en TRES canales — más allá de solo el bg:
              // (a) barra lateral izquierda (2px primary), (b) bg surface-2,
              // (c) text fuller + font-medium. WCAG 2.1: state change debe
              // usar más de un canal visual.
              active
                ? "bg-[var(--color-surface-2)] text-[var(--color-text)] font-medium before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function RoleShell({ role, userName, navItems, children }: RoleShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Sheet de navegación para viewports `<lg`. Sin esto, el sidebar
  // `hidden lg:flex` dejaba al usuario móvil sin forma de navegar.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pageTitle = findRoute(pathname)?.label ?? "Portal MDM";

  // Cerrar el sheet automáticamente al cambiar de ruta — evita que quede
  // abierto encima del nuevo contenido cuando el usuario clickea un link.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Dedupe de prefetch por ruta — hover repetido no dispara N requests.
  const prefetchedRef = useRef<Set<string>>(new Set());
  const prefetchRoute = useCallback(
    (href: string) => {
      if (prefetchedRef.current.has(href)) return;
      prefetchedRef.current.add(href);
      router.prefetch(href);
    },
    [router],
  );

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

        <NavList items={navItems} pathname={pathname} onHoverPrefetch={prefetchRoute} />

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
        <header className="bg-surface flex h-14 items-center justify-between gap-4 border-b border-[var(--color-border)] px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* Hamburger — solo en viewports `<lg`. Abre el sheet de nav. */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menú de navegación"
              className={cn(
                "lg:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text)] transition",
                "hover:bg-[var(--color-surface-2)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
              )}
            >
              <Menu aria-hidden className="h-5 w-5" />
            </button>
            <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-text)]">
              {pageTitle}
            </span>
          </div>
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

      {/* Sheet de navegación móvil — animación slide-from-left vía las
          utilities `data-[state=open]:slide-in-from-left` de tailwindcss-animate
          ya disponibles en el portal. Se cierra al navegar (effect en el
          padre) o al apretar Escape (Radix Dialog default). */}
      <DialogPrimitive.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            )}
          />
          <DialogPrimitive.Content
            aria-label={`Navegación — ${ROLE_LABELS[role]}`}
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-[var(--color-surface)] shadow-2xl lg:hidden",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-left",
              "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left",
              "duration-200",
            )}
          >
            <div className="flex h-14 items-center justify-between gap-2 border-b border-[var(--color-border)] px-4">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="bg-[var(--color-primary)] inline-block h-2.5 w-2.5 rounded-full"
                />
                <DialogPrimitive.Title className="text-sm font-semibold tracking-tight text-[var(--color-text)]">
                  Portal MDM
                </DialogPrimitive.Title>
              </div>
              <DialogPrimitive.Close
                aria-label="Cerrar menú"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-muted)] transition",
                  "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                )}
              >
                <X aria-hidden className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
            <NavList
              items={navItems}
              pathname={pathname}
              onItemClick={() => setMobileNavOpen(false)}
              onHoverPrefetch={prefetchRoute}
            />
            <div className="border-t border-[var(--color-border)] p-3">
              <div className="mb-2 text-xs text-[var(--color-text-muted)]">
                {userName ?? "Sesión"} · {ROLE_LABELS[role]}
              </div>
              {/* Misma forma de logout que el dropdown desktop — POST form
                  para que la cookie httpOnly se limpie server-side. */}
              <form method="post" action="/api/auth/logout">
                <button
                  type="submit"
                  className={cn(
                    "flex w-full min-h-[44px] items-center gap-2 rounded-md px-2 py-2 text-sm text-[var(--color-destructive)] transition",
                    "hover:bg-[var(--color-destructive-glow)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                  )}
                >
                  <LogOut aria-hidden className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} role={role} />
    </PreferenciasProvider>
  );
}
