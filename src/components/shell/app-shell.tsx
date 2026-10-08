"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { NAV_ITEMS, PRIMARY_NAV, MORE_NAV } from "./nav-items";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** Static briefing period for the demonstrator masthead. */
const BRIEFING_PERIOD = "Q3 2026 briefing";

function Wordmark({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Circa — home">
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          onDark ? "bg-evergreen-600/90 text-white" : "bg-evergreen-800 text-evergreen-50",
        )}
      >
        <Logo size={20} />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif text-[1.15rem] font-semibold tracking-[-0.01em]",
            onDark ? "text-white" : "text-foreground",
          )}
        >
          Circa
        </span>
        <span
          className={cn(
            "mt-[3px] text-[0.5625rem] uppercase tracking-[0.2em]",
            onDark ? "text-graphite-300" : "text-muted-foreground",
          )}
        >
          Circular economy intelligence
        </span>
      </span>
    </Link>
  );
}

function MoreMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1 py-3 text-[0.8125rem] text-graphite-200 transition-colors hover:text-white"
      >
        More <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 w-56 overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-raised"
        >
          {MORE_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs transition-colors",
                  active
                    ? "bg-evergreen-700/10 font-medium text-evergreen-800 dark:text-evergreen-100"
                    : "text-foreground hover:bg-surface",
                )}
              >
                <item.icon className="h-4 w-4 text-stone-500" strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  React.useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Masthead — dark graphite, editorial */}
      <header className="sticky top-0 z-40 bg-graphite-900 text-graphite-100">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Wordmark onDark />
          <div className="hidden items-center gap-3 lg:flex">
            <span className="rounded-full border border-graphite-700 px-2.5 py-1 text-[0.625rem] uppercase tracking-[0.14em] text-graphite-300">
              {BRIEFING_PERIOD}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            className="rounded-md border border-graphite-700 p-2 text-graphite-100 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Primary nav row (desktop) */}
        <nav
          aria-label="Primary"
          className="mx-auto hidden max-w-content items-center gap-6 border-t border-graphite-800 px-4 sm:px-6 lg:flex lg:px-10"
        >
          {PRIMARY_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-3 text-[0.8125rem] transition-colors",
                  active ? "font-medium text-white" : "text-graphite-300 hover:text-white",
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-copper-400" />
                )}
              </Link>
            );
          })}
          <div className="ml-auto">
            <MoreMenu pathname={pathname} />
          </div>
        </nav>
      </header>

      {/* Mobile nav sheet */}
      {mobileOpen && (
        <div className="border-b border-border bg-surface px-4 py-4 lg:hidden">
          <MobileNav pathname={pathname} />
        </div>
      )}

      <main
        key={pathname}
        className="animate-rise mx-auto w-full max-w-content flex-1 px-4 py-7 sm:px-6 lg:px-10 lg:py-9"
      >
        {children}
      </main>

      <footer className="border-t border-border bg-surface/60">
        <div className="mx-auto max-w-content px-4 py-4 sm:px-6 lg:px-10">
          <p className="text-2xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Circa</span> · CivTech 12.3 demonstrator ·
            Ambidexters Ltd × The DataKirk SCIO · illustrative dataset, no Zero Waste Scotland or
            CivTech endorsement implied.
          </p>
        </div>
      </footer>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  const groups = ["Intelligence", "Workspace", "Trust"] as const;
  return (
    <nav aria-label="Primary" className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group}>
          <p className="mb-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {group}
          </p>
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.filter((i) => i.group === group).map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-evergreen-700/10 font-medium text-evergreen-800 dark:text-evergreen-100"
                        : "text-foreground hover:bg-card",
                    )}
                  >
                    <item.icon className="h-4 w-4 text-stone-500" strokeWidth={1.8} />
                    {item.label}
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
