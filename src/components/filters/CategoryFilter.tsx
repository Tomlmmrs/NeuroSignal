"use client";

import { useRouter, useSearchParams } from "next/navigation";

const categories = [
  { key: "all", label: "All", color: "bg-muted/20 text-muted-foreground" },
  { key: "model", label: "AI Models", color: "bg-cat-model/20 text-cat-model" },
  { key: "tool", label: "AI Tools", color: "bg-cat-tool/20 text-cat-tool" },
  { key: "research", label: "Research", color: "bg-cat-research/20 text-cat-research" },
  { key: "company", label: "Companies", color: "bg-cat-company/20 text-cat-company" },
  { key: "opensource", label: "Open Source", color: "bg-cat-opensource/20 text-cat-opensource" },
  { key: "policy", label: "Policy", color: "bg-cat-policy/20 text-cat-policy" },
  { key: "market", label: "Market", color: "bg-cat-market/20 text-cat-market" },
] as const;

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "all";

  const handleSelect = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "all") {
      params.delete("category");
    } else {
      params.set("category", key);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
      {categories.map((cat) => {
        const isActive =
          (cat.key === "all" && activeCategory === "all") || activeCategory === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => handleSelect(cat.key)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition-all ${
              isActive
                ? `${cat.color} ring-1 ring-current/20`
                : "bg-card text-muted-foreground hover:text-foreground border border-border-subtle"
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
