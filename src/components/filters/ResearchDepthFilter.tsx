"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePrefetchedNavigation } from "@/components/layout/usePrefetchedNavigation";

const depths = [
  { key: "all", label: "All Research", color: "bg-muted/20 text-muted-foreground" },
  { key: "general", label: "Important", color: "bg-amber-500/20 text-amber-600" },
  { key: "intermediate", label: "Notable", color: "bg-blue-500/20 text-blue-500" },
  { key: "advanced", label: "Deep / Niche", color: "bg-purple-500/20 text-purple-500" },
] as const;

export default function ResearchDepthFilter() {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const { isPending, navigate, prefetch } = usePrefetchedNavigation();
  const currentDepth = searchParams.get("depth") ?? "all";
  const [pendingDepth, setPendingDepth] = useState<string | null>(null);
  const activeDepth = pendingDepth ?? currentDepth;

  useEffect(() => {
    setPendingDepth(null);
  }, [searchKey]);

  const getHref = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "all") {
      params.delete("depth");
    } else {
      params.set("depth", key);
    }
    return `/?${params.toString()}`;
  };

  const handleSelect = (key: string) => {
    const href = getHref(key);
    setPendingDepth(key);
    prefetch(href);
    navigate(href);
  };

  return (
    <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
      {depths.map((d) => {
        const isActive = activeDepth === d.key || (!searchParams.has("depth") && d.key === "all");
        return (
          <button
            key={d.key}
            type="button"
            onClick={() => handleSelect(d.key)}
            onMouseEnter={() => prefetch(getHref(d.key))}
            onFocus={() => prefetch(getHref(d.key))}
            onTouchStart={() => prefetch(getHref(d.key))}
            className={`rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${
              isActive
                ? `${d.color} ring-1 ring-current/20`
                : "border border-border-subtle bg-background/60 text-muted-foreground hover:text-foreground"
            }`}
            aria-busy={isPending && isActive}
          >
            <span className="inline-flex items-center gap-1.5">
              <span>{d.label}</span>
              {isPending && isActive && <Loader2 className="h-3 w-3 animate-spin" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
