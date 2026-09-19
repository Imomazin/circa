import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  Recycle,
  SlidersHorizontal,
  Landmark,
  BarChart3,
  BookOpen,
  ShieldCheck,
  PlayCircle,
  Info,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: "Intelligence" | "Workspace" | "Trust";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard, group: "Intelligence" },
  { label: "Businesses", href: "/businesses", icon: Building2, group: "Workspace" },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck, group: "Workspace" },
  { label: "Opportunities", href: "/opportunities", icon: Recycle, group: "Workspace" },
  { label: "Scenarios", href: "/scenarios", icon: SlidersHorizontal, group: "Workspace" },
  { label: "Investor Readiness", href: "/investor-readiness", icon: Landmark, group: "Workspace" },
  { label: "Programme Intelligence", href: "/programme", icon: BarChart3, group: "Intelligence" },
  { label: "Methodology", href: "/methodology", icon: BookOpen, group: "Trust" },
  { label: "Governance", href: "/governance", icon: ShieldCheck, group: "Trust" },
  { label: "Demo", href: "/demo", icon: PlayCircle, group: "Trust" },
  { label: "About", href: "/about", icon: Info, group: "Trust" },
];
