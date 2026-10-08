import {
  LayoutDashboard,
  Target,
  Layers,
  Share2,
  Grid3x3,
  Building2,
  SlidersHorizontal,
  GitCompareArrows,
  ClipboardCheck,
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
  /** primary = shown in the masthead bar; more = in the overflow menu. */
  tier: "primary" | "more";
  /** Grouping label used only in the mobile sheet and the overflow menu. */
  group: "Intelligence" | "Workspace" | "Trust";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard, tier: "primary", group: "Intelligence" },
  { label: "Opportunities", href: "/opportunities", icon: Target, tier: "primary", group: "Intelligence" },
  { label: "Materials", href: "/materials", icon: Layers, tier: "primary", group: "Intelligence" },
  { label: "Matching", href: "/matches", icon: Share2, tier: "primary", group: "Intelligence" },
  { label: "Sectors", href: "/sectors", icon: Grid3x3, tier: "primary", group: "Intelligence" },
  { label: "Organisations", href: "/businesses", icon: Building2, tier: "primary", group: "Workspace" },
  { label: "Scenarios", href: "/scenarios", icon: SlidersHorizontal, tier: "primary", group: "Workspace" },

  { label: "Compare", href: "/compare", icon: GitCompareArrows, tier: "more", group: "Workspace" },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck, tier: "more", group: "Workspace" },
  { label: "Investor readiness", href: "/investor-readiness", icon: Landmark, tier: "more", group: "Workspace" },
  { label: "Programme analytics", href: "/programme", icon: BarChart3, tier: "more", group: "Intelligence" },
  { label: "Methodology", href: "/methodology", icon: BookOpen, tier: "more", group: "Trust" },
  { label: "Governance", href: "/governance", icon: ShieldCheck, tier: "more", group: "Trust" },
  { label: "Demo", href: "/demo", icon: PlayCircle, tier: "more", group: "Trust" },
  { label: "About", href: "/about", icon: Info, tier: "more", group: "Trust" },
];

export const PRIMARY_NAV = NAV_ITEMS.filter((i) => i.tier === "primary");
export const MORE_NAV = NAV_ITEMS.filter((i) => i.tier === "more");
