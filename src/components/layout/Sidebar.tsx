"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Zap,
  Trophy,
  Sparkles,
  TrendingUp,
  Eye,
  GitBranch,
  BookOpen,
  Brain,
  Wrench,
  FlaskConical,
  Building2,
  Code2,
  Scale,
  BarChart3,
  Radar,
  Flame,
  Bookmark,
  Search,
  Menu,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  param: string; // which URL param this sets
}

const views: NavItem[] = [
  { key: "latest", label: "Latest", icon: Zap, param: "view" },
  { key: "important", label: "Most Important", icon: Trophy, param: "view" },
  { key: "novel", label: "Most Novel", icon: Sparkles, param: "view" },
  { key: "impactful", label: "Most Impactful", icon: TrendingUp, param: "view" },
  { key: "underrated", label: "Underrated Signals", icon: Eye, param: "view" },
  { key: "opensource", label: "Open Source Momentum", icon: GitBranch, param: "view" },
  { key: "research", label: "Research to Watch", icon: BookOpen, param: "view" },
];

const categories: NavItem[] = [
  { key: "model", label: "AI Models", icon: Brain, param: "category" },
  { key: "tool", label: "AI Tools", icon: Wrench, param: "category" },
  { key: "research", label: "Research", icon: FlaskConical, param: "category" },
  { key: "company", label: "Companies & Labs", icon: Building2, param: "category" },
  { key: "opensource", label: "Open Source", icon: Code2, param: "category" },
  { key: "policy", label: "Policy & Regulation", icon: Scale, param: "category" },
  { key: "market", label: "Market & Industry", icon: BarChart3, param: "category" },
];

const features: NavItem[] = [
  { key: "signals", label: "Early Signals", icon: Radar, param: "feature" },
  { key: "trending", label: "Trending", icon: Flame, param: "feature" },
  { key: "bookmarks", label: "Bookmarks", icon: Bookmark, param: "feature" },
  { key: "search", label: "Search", icon: Search, param: "feature" },
];

function NavSection({
  title,
  items,
  activeKey,
  activeParam,
  onSelect,
}: {
  title: string;
  items: NavItem[];
  activeKey: string | null;
  activeParam: string;
  onSelect: (item: NavItem) => void;
}) {
  return (
    <div className="mb-4">
      <h3 className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-muted uppercase">
        {title}
      </h3>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive = activeParam === item.param && activeKey === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item)}
              className={`flex items-center gap-2.5 px-3 py-1.5 text-xs rounded-md transition-colors text-left ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeParam =
    (searchParams.has("feature") && "feature") ||
    (searchParams.has("category") && "category") ||
    "view";
  const activeKey = searchParams.get(activeParam) ?? "latest";

  const handleSelect = (item: NavItem) => {
    const params = new URLSearchParams();
    params.set(item.param, item.key);
    router.push(`/?${params.toString()}`);
    setMobileOpen(false);
  };

  const content = (
    <>
      <NavSection
        title="Views"
        items={views}
        activeKey={activeKey}
        activeParam={activeParam}
        onSelect={handleSelect}
      />
      <NavSection
        title="Categories"
        items={categories}
        activeKey={activeKey}
        activeParam={activeParam}
        onSelect={handleSelect}
      />
      <NavSection
        title="Features"
        items={features}
        activeKey={activeKey}
        activeParam={activeParam}
        onSelect={handleSelect}
      />
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3.5 left-14 z-50 p-1 rounded-md bg-card border border-border lg:hidden"
      >
        {mobileOpen ? (
          <X className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Menu className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-52 bg-background border-r border-border overflow-y-auto py-3 transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {content}
      </aside>
    </>
  );
}
