import {
  BarChart3,
  BookOpen,
  Bookmark,
  Brain,
  Building2,
  Code2,
  Eye,
  Flame,
  FlaskConical,
  GitBranch,
  Radar,
  Scale,
  Sparkles,
  TrendingUp,
  Trophy,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  param: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "Views",
    items: [
      { key: "latest", label: "Latest", icon: Zap, param: "view" },
      { key: "important", label: "Most Important", icon: Trophy, param: "view" },
      { key: "novel", label: "Most Novel", icon: Sparkles, param: "view" },
      { key: "impactful", label: "Most Impactful", icon: TrendingUp, param: "view" },
      { key: "underrated", label: "Underrated Signals", icon: Eye, param: "view" },
      { key: "opensource", label: "Open Source Momentum", icon: GitBranch, param: "view" },
      { key: "research", label: "Research to Watch", icon: BookOpen, param: "view" },
    ],
  },
  {
    title: "Categories",
    items: [
      { key: "model", label: "AI Models", icon: Brain, param: "category" },
      { key: "tool", label: "AI Tools", icon: Wrench, param: "category" },
      { key: "research", label: "Research", icon: FlaskConical, param: "category" },
      { key: "company", label: "Companies & Labs", icon: Building2, param: "category" },
      { key: "opensource", label: "Open Source", icon: Code2, param: "category" },
      { key: "policy", label: "Policy & Regulation", icon: Scale, param: "category" },
      { key: "market", label: "Market & Industry", icon: BarChart3, param: "category" },
    ],
  },
  {
    title: "Features",
    items: [
      { key: "signals", label: "Early Signals", icon: Radar, param: "feature" },
      { key: "trending", label: "Trending", icon: Flame, param: "feature" },
      { key: "bookmarks", label: "Bookmarks", icon: Bookmark, param: "feature" },
    ],
  },
];

interface SearchParamReader {
  get(name: string): string | null;
  has(name: string): boolean;
}

export function getActiveNavigationState(searchParams: SearchParamReader) {
  const activeParam =
    (searchParams.has("feature") && "feature") ||
    (searchParams.has("category") && "category") ||
    "view";
  const activeKey = searchParams.get(activeParam) ?? "latest";
  const activeItem =
    navSections
      .flatMap((section) => section.items)
      .find((item) => item.param === activeParam && item.key === activeKey) ??
    navSections[0].items[0];

  return {
    activeItem,
    activeKey,
    activeParam,
  };
}
