import {
  LayoutDashboard,
  Target,
  Layers,
  Share2,
  BarChart3,
  Building2,
  GitCompareArrows,
  ClipboardCheck,
  SlidersHorizontal,
  Landmark,
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
  { label: "Opportunities", href: "/opportunities", icon: Target, group: "Intelligence" },
  { label: "Materials", href: "/materials", icon: Layers, group: "Intelligence" },
  { label: "Matching & pipeline", href: "/matches", icon: Share2, group: "Intelligence" },
  { label: "Programme analytics", href: "/programme", icon: BarChart3, group: "Intelligence" },

  { label: "Organisations", href: "/businesses", icon: Building2, group: "Workspace" },
  { label: "Compare", href: "/compare", icon: GitCompareArrows, group: "Workspace" },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck, group: "Workspace" },
  { label: "Scenarios", href: "/scenarios", icon: SlidersHorizontal, group: "Workspace" },
  { label: "Investor readiness", href: "/investor-readiness", icon: Landmark, group: "Workspace" },

  { label: "Methodology", href: "/methodology", icon: BookOpen, group: "Trust" },
  { label: "Governance", href: "/governance", icon: ShieldCheck, group: "Trust" },
  { label: "Demo", href: "/demo", icon: PlayCircle, group: "Trust" },
  { label: "About", href: "/about", icon: Info, group: "Trust" },
];
