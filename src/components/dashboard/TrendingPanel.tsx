"use client";

import { Flame, TrendingUp } from "lucide-react";
import type { Cluster } from "@/lib/db/schema";

const categoryColors: Record<string, string> = {
  model: "text-cat-model",
  tool: "text-cat-tool",
  research: "text-cat-research",
  company: "text-cat-company",
  opensource: "text-cat-opensource",
  policy: "text-cat-policy",
  market: "text-cat-market",
};

export default function TrendingPanel({ clusters }: { clusters: Cluster[] }) {
  const sorted = [...clusters].sort(
    (a, b) => (b.trendVelocity ?? 0) - (a.trendVelocity ?? 0)
  );

  if (sorted.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-card/75">
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
        <Flame className="h-4 w-4 text-warning" />
        <h2 className="text-sm font-semibold text-foreground">Trending Now</h2>
        <span className="ml-auto text-[11px] text-muted">{sorted.length}</span>
      </div>

      <div className="divide-y divide-border-subtle">
        {sorted.map((cluster) => (
          <div
            key={cluster.id}
            className="px-4 py-3 transition-colors hover:bg-card-hover"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {cluster.title}
                </h3>
                {cluster.summary && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {cluster.summary}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-[11px] font-medium text-success">
                  {(cluster.trendVelocity ?? 0).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`text-[11px] ${categoryColors[cluster.category] ?? "text-muted-foreground"}`}
              >
                {cluster.category}
              </span>
              <span className="text-[11px] text-muted">
                {cluster.itemCount ?? 0} item{(cluster.itemCount ?? 0) !== 1 && "s"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
