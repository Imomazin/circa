"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, CircleDashed } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

const GROUP_ORDER = ["Intelligence", "Workspace", "Trust"] as const;
const GROUP_LABELS: Record<string, string> = {
  Intelligence: "Intelligence",
  Workspace: "Workspace",
  Trust: "Trust & governance",
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-5" aria-label="Primary">
      {GROUP_ORDER.map((group) => (
        <div key={group}>
          <p className="mb-1.5 px-3 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
            {GROUP_LABELS[group]}
          </p>
          <ul className="flex flex-col gap-0.5">
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
                      "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-evergreen-700 text-white"
                        : "text-charcoal-600 hover:bg-charcoal-100 hover:text-foreground dark:text-charcoal-300 dark:hover:bg-charcoal-800",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-warmgrey-500")} />
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
    <Link href="/" className="flex items-center gap-2.5 px-3 py-1">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-evergreen-700 text-white">
        <CircleDashed className="h-5 w-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-semibold tracking-tight text-foreground">Circa</span>
        <span className="text-2xs text-muted-foreground">Commercial decision intelligence</span>
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
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border py-3">
          <Brand />
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto p-3">
          <NavLinks pathname={pathname} />
        </div>
        <div className="border-t border-border p-3">
          <p className="rounded-md bg-charcoal-100 px-2.5 py-2 text-2xs leading-relaxed text-muted-foreground dark:bg-charcoal-800">
            <span className="font-semibold text-foreground">CivTech 12.3</span> demonstrator ·
            Ambidexters Ltd × The DataKirk SCIO. Synthetic data.
          </p>
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
            className="rounded-md border border-border p-2 text-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {mobileOpen && (
          <div className="border-b border-border bg-surface p-3 lg:hidden">
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        )}

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
