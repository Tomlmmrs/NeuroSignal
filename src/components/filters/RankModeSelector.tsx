"use client";

import { useRouter, useSearchParams } from "next/navigation";

const modes = [
  { key: "latest", label: "Latest" },
  { key: "important", label: "Most Important" },
  { key: "novel", label: "Most Novel" },
  { key: "impactful", label: "Most Impactful" },
  { key: "underrated", label: "Underrated" },
  { key: "opensource", label: "Open Source" },
  { key: "research", label: "Research" },
] as const;

export default function RankModeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeMode = searchParams.get("view") ?? "latest"; // Default to latest, not important

  const handleSelect = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", key);
    params.delete("feature");
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 scrollbar-none">
      {modes.map((mode) => {
        const isActive = activeMode === mode.key;
        return (
          <button
            key={mode.key}
            type="button"
            onClick={() => handleSelect(mode.key)}
            className={`rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.22)]"
                : "bg-background/60 text-muted-foreground hover:bg-card-hover hover:text-foreground"
            }`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
