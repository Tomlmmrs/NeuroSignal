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
    <div className="bg-card border border-border-subtle rounded-lg">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border-subtle">
        <Flame className="h-4 w-4 text-warning" />
        <h2 className="text-xs font-semibold text-foreground">Trending Now</h2>
        <span className="ml-auto text-[10px] text-muted">{sorted.length}</span>
      </div>

      <div className="divide-y divide-border-subtle">
        {sorted.map((cluster) => (
          <div
            key={cluster.id}
            className="px-3.5 py-2.5 hover:bg-card-hover transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-medium text-foreground truncate">
                  {cluster.title}
                </h3>
                {cluster.summary && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {cluster.summary}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-[10px] font-medium text-success">
                  {(cluster.trendVelocity ?? 0).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`text-[10px] ${categoryColors[cluster.category] ?? "text-muted-foreground"}`}
              >
                {cluster.category}
              </span>
              <span className="text-[10px] text-muted">
                {cluster.itemCount ?? 0} item{(cluster.itemCount ?? 0) !== 1 && "s"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
