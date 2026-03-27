"use client";

import { useRouter, useSearchParams } from "next/navigation";

const windows = [
  { key: "24h", label: "24h" },
  { key: "3d", label: "3 days" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
] as const;

export default function TimeWindowFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeWindow = searchParams.get("t") ?? "3d";

  const handleSelect = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "3d") {
      params.delete("t"); // default, don't clutter URL
    } else {
      params.set("t", key);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="space-y-2">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
        Time Window
      </span>
      <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 scrollbar-none">
      {windows.map((w) => {
        const isActive = activeWindow === w.key || (!searchParams.has("t") && w.key === "3d");
        return (
          <button
            key={w.key}
            type="button"
            onClick={() => handleSelect(w.key)}
            className={`rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.22)]"
                : "bg-background/60 text-muted-foreground hover:bg-card-hover hover:text-foreground"
            }`}
          >
            {w.label}
          </button>
        );
      })}
      </div>
    </div>
  );
}
