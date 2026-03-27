"use client";

import { useRouter, useSearchParams } from "next/navigation";

const depths = [
  { key: "all", label: "All Research" },
  { key: "general", label: "Important" },
  { key: "intermediate", label: "Notable" },
  { key: "advanced", label: "Deep / Niche" },
] as const;

export default function ResearchDepthFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeDepth = searchParams.get("depth") ?? "all";

  const handleSelect = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "all") {
      params.delete("depth");
    } else {
      params.set("depth", key);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="space-y-2">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
        Research Depth
      </span>
      <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 scrollbar-none">
      {depths.map((d) => {
        const isActive = activeDepth === d.key || (!searchParams.has("depth") && d.key === "all");
        return (
          <button
            key={d.key}
            type="button"
            onClick={() => handleSelect(d.key)}
            className={`rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.22)]"
                : "bg-background/60 text-muted-foreground hover:bg-card-hover hover:text-foreground"
            }`}
          >
            {d.label}
          </button>
        );
      })}
      </div>
    </div>
  );
}
