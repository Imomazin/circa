"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const GROUP_ORDER = ["Intelligence", "Workspace", "Trust"] as const;
const GROUP_LABELS: Record<string, string> = {
  Intelligence: "Decision intelligence",
  Workspace: "Workspace",
  Trust: "Trust & method",
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-6" aria-label="Primary">
      {GROUP_ORDER.map((group) => (
        <div key={group}>
          <p className="mb-2 px-3 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            {GROUP_LABELS[group]}
          </p>
          <ul className="flex flex-col gap-px">
            {NAV_ITEMS.filter((i) => i.group === group).map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-md px-3 py-[0.4rem] text-[0.8125rem] transition-colors",
                      active
                        ? "bg-evergreen-700/10 font-medium text-evergreen-800 dark:bg-evergreen-500/15 dark:text-evergreen-100"
                        : "text-graphite-600 hover:bg-surface hover:text-foreground dark:text-graphite-300",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-copper-400" />
                    )}
                    <Icon
                      className={cn(
                        "h-[1.05rem] w-[1.05rem] shrink-0",
                        active ? "text-evergreen-700 dark:text-evergreen-300" : "text-stone-500",
                      )}
                      strokeWidth={active ? 2.1 : 1.8}
                    />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-3 py-1" aria-label="Circa — home">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-evergreen-800 text-evergreen-50">
        <Logo size={22} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.05rem] font-semibold tracking-tight text-foreground">
          Circa
        </span>
        <span className="mt-0.5 text-[0.625rem] uppercase tracking-[0.14em] text-muted-foreground">
          Circular economy intelligence
        </span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[17rem] shrink-0 flex-col border-r border-border bg-surface/70 lg:flex">
        <div className="border-b border-border px-2 py-3.5">
          <Brand />
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-4">
          <NavLinks pathname={pathname} />
        </div>
        <div className="border-t border-border p-3">
          <div className="rounded-md border border-border bg-card px-3 py-2.5">
            <p className="text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
              CivTech 12.3 demonstrator
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Ambidexters Ltd × The DataKirk SCIO. Illustrative dataset.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <Brand />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            className="rounded-md border border-border-strong p-2 text-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {mobileOpen && (
          <div className="border-b border-border bg-surface p-3 lg:hidden">
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        )}

        <main
          key={pathname}
          className="animate-rise mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
