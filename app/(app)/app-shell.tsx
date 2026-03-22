"use client";

import {
  ArrowRight,
  BrainCircuit,
  LayoutGrid,
  LibraryBig,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  userEmail: string;
  userName: string;
}

interface NavigationItem {
  description: string;
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  label: string;
}

interface PageAction {
  href: string;
  label: string;
}

interface PageMeta {
  action?: PageAction;
  description: string;
  eyebrow: string;
  title: string;
}

const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  {
    description: "Overview, revision volume and next actions.",
    href: "/dashboard",
    icon: LayoutGrid,
    isActive: (pathname: string): boolean => pathname === "/dashboard",
    label: "Dashboard",
  },
  {
    description: "Browse and organise every deck.",
    href: "/decks",
    icon: LibraryBig,
    isActive: (pathname: string): boolean =>
      pathname.startsWith("/decks") && !pathname.endsWith("/study"),
    label: "Decks",
  },
  {
    description: "Open a deck to launch a study session.",
    href: "/decks",
    icon: BrainCircuit,
    isActive: (pathname: string): boolean => pathname.endsWith("/study"),
    label: "Study",
  },
  {
    description: "Account, AI and application preferences.",
    href: "/settings",
    icon: Settings2,
    isActive: (pathname: string): boolean => pathname.startsWith("/settings"),
    label: "Settings",
  },
] as const;

const actionLinkClassName =
  "inline-flex min-h-[44px] items-center justify-center gap-sm rounded-full border border-outline bg-surface-overlay px-md py-[10px] text-sm font-semibold text-ink-primary transition-all duration-fast ease-spring hover:border-outline-strong hover:bg-surface-elevated hover:text-ink-primary";

function resolvePageMeta(pathname: string): PageMeta {
  if (pathname.endsWith("/study")) {
    const deckPath = pathname.replace(/\/study$/, "");

    return {
      action: {
        href: deckPath,
        label: "Back to deck",
      },
      description: "Review due cards with the guided SM-2 flow.",
      eyebrow: "Study Session",
      title: "Study",
    };
  }

  if (pathname.startsWith("/decks/")) {
    return {
      action: {
        href: "/decks",
        label: "Back to decks",
      },
      description: "Inspect cards, metrics and generation workflows for this deck.",
      eyebrow: "Deck Detail",
      title: "Deck",
    };
  }

  if (pathname.startsWith("/decks")) {
    return {
      action: {
        href: "/dashboard",
        label: "Back to dashboard",
      },
      description: "Organise your knowledge into focused collections of cards.",
      eyebrow: "Library",
      title: "Decks",
    };
  }

  if (pathname.startsWith("/settings")) {
    return {
      action: {
        href: "/dashboard",
        label: "Open dashboard",
      },
      description: "Adjust your account, AI setup and long-term preferences.",
      eyebrow: "Preferences",
      title: "Settings",
    };
  }

  return {
    action: {
      href: "/decks",
      label: "View decks",
    },
    description: "Track revisions, decks and the next actions that matter.",
    eyebrow: "Overview",
    title: "Dashboard",
  };
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({
  children,
  userEmail,
  userName,
}: AppShellProps): JSX.Element {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pageMeta = resolvePageMeta(pathname);
  const userInitials = getInitials(userName || userEmail || "L");

  return (
    <div className="min-h-screen bg-background text-ink-primary md:flex">
      <aside
        className={cn(
          "hidden min-h-screen shrink-0 flex-col border-r border-outline-subtle bg-surface-base px-md py-lg transition-all duration-normal ease-smooth md:flex",
          sidebarCollapsed ? "w-24" : "w-72",
        )}
      >
        <div className="flex items-center justify-between gap-sm">
          <Link
            className={cn(
              "inline-flex items-center gap-sm rounded-full border border-accent-dim bg-accent-dim px-sm py-xs text-xs uppercase tracking-label text-accent shadow-accent transition-all duration-fast ease-spring hover:brightness-105",
              sidebarCollapsed ? "justify-center px-xs" : null,
            )}
            href="/dashboard"
          >
            <Sparkles className="h-[18px] w-[18px]" />
            {!sidebarCollapsed ? <span>Lumino</span> : null}
          </Link>

          <button
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-subtle bg-surface-overlay text-ink-secondary transition-colors duration-fast ease-smooth hover:border-outline hover:text-ink-primary"
            onClick={() => {
              setSidebarCollapsed((currentValue) => !currentValue);
            }}
            type="button"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav className="mt-xl flex-1">
          <ul className="space-y-sm">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = item.isActive(pathname);
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  <Link
                    className={cn(
                      "group flex items-center gap-md rounded-lg border px-md py-sm transition-all duration-fast ease-spring",
                      isActive
                        ? "border-accent-dim bg-accent-dim text-accent shadow-accent"
                        : "border-transparent text-ink-secondary hover:border-outline-subtle hover:bg-surface-glass hover:text-ink-primary",
                      sidebarCollapsed ? "justify-center px-sm" : null,
                    )}
                    href={item.href}
                    title={item.description}
                  >
                    <Icon
                      className={cn(
                        "shrink-0 transition-transform duration-fast ease-spring",
                        isActive ? "h-6 w-6 scale-110" : "h-[22px] w-[22px]",
                      )}
                    />

                    {!sidebarCollapsed ? (
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p
                          className={cn(
                            "text-xs",
                            isActive ? "text-accent" : "text-ink-secondary",
                          )}
                        >
                          {item.description}
                        </p>
                      </div>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="rounded-xl border border-outline-subtle bg-surface-elevated p-md shadow-sm">
          <div className="flex items-center gap-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-subtle bg-surface-overlay text-sm font-semibold text-ink-primary">
              {userInitials}
            </div>

            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-primary">
                  {userName}
                </p>
                <p className="truncate text-xs text-ink-secondary">{userEmail}</p>
              </div>
            ) : null}
          </div>

          {!sidebarCollapsed ? (
            <div className="mt-md">
              <Badge variant="accent">Authenticated</Badge>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-outline-subtle bg-background">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-md px-md py-lg md:px-xl">
            <div className="min-w-0 space-y-xs">
              <p className="text-xs uppercase tracking-label text-ink-secondary">
                {pageMeta.eyebrow}
              </p>
              <div className="flex items-center gap-sm">
                <h1 className="truncate text-2xl tracking-title text-ink-primary md:text-3xl">
                  {pageMeta.title}
                </h1>
                <Badge variant="neutral" className="hidden sm:inline-flex">
                  App Layout
                </Badge>
              </div>
              <p className="max-w-2xl text-sm text-ink-secondary md:text-base">
                {pageMeta.description}
              </p>
            </div>

            {pageMeta.action ? (
              <Link className={cn(actionLinkClassName, "hidden md:inline-flex")} href={pageMeta.action.href}>
                {pageMeta.action.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </header>

        <main className="flex-1 px-md pb-[calc(var(--space-2xl)+88px+env(safe-area-inset-bottom))] pt-lg md:px-xl md:pb-2xl md:pt-xl">
          <div className="mx-auto w-full max-w-7xl">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={pathname}
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 8 }}
                layout="position"
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-subtle bg-[rgba(8,8,8,0.85)] backdrop-blur-xl md:hidden">
        <ul className="grid grid-cols-4 gap-xs px-sm pb-[calc(env(safe-area-inset-bottom)+var(--space-sm))] pt-sm">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = item.isActive(pathname);
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <Link
                  className={cn(
                    "flex min-h-[64px] flex-col items-center justify-center gap-xs rounded-lg px-xs py-sm text-[10px] tracking-[0.03em] transition-all duration-fast ease-spring",
                    isActive
                      ? "bg-accent-dim text-accent"
                      : "text-ink-secondary hover:bg-surface-glass hover:text-ink-primary",
                  )}
                  href={item.href}
                >
                  <Icon
                    className={cn(
                      "transition-transform duration-fast ease-spring",
                      isActive ? "h-6 w-6 scale-110" : "h-[22px] w-[22px]",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
