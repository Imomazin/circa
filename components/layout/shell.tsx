"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Building2,
  Scale,
  ShieldCheck,
  Play,
  Info,
  ChevronRight,
} from "lucide-react";
const links = [
  ["/overview", "Overview", LayoutDashboard],
  ["/assessments", "Assessments", BriefcaseBusiness],
  ["/analytics", "Analytics", ChartNoAxesCombined],
  ["/programme", "Programme insight", Building2],
  ["/methodology", "Methodology", Scale],
  ["/governance", "Data & governance", ShieldCheck],
  ["/demo", "Demonstration", Play],
  ["/about", "About Circa", Info],
] as const;
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/overview">
          <span className="brand-mark">c</span>circa
        </Link>
        <p className="eyebrow">Commercial intelligence</p>
        <nav aria-label="Main navigation">
          {links.map(([url, label, Icon]) => (
            <Link
              key={url}
              className={`nav-link ${pathname.startsWith(url) ? "active" : ""}`}
              aria-current={pathname.startsWith(url) ? "page" : undefined}
              href={url}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <strong>Ambidexters × The DataKirk</strong>
          <br />
          CivTech Round 12
          <br />
          Product demonstrator · 12.3
        </div>
      </aside>
      <div className="shell">
        <header className="topbar">
          <div className="flex small muted">
            <span>Circa</span>
            <ChevronRight size={12} />
            <span>
              {links.find(([u]) => pathname.startsWith(u))?.[1] ?? "Assessment"}
            </span>
          </div>
          <span className="mobile-brand">circa</span>
          <div className="flex">
            <Link href="/demo" className="badge grey">
              Synthetic demonstration
            </Link>
            <span className="small muted">Presenter workspace</span>
            <span className="avatar" aria-label="Demo presenter">
              DP
            </span>
          </div>
        </header>
        <main id="main" className="content">
          {children}
        </main>
      </div>
    </>
  );
}
