"use client";

import { useState } from "react";
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code2,
  Shield,
  Clock,
  HelpCircle,
  Loader2,
  Lightbulb,
} from "lucide-react";
import type { Item } from "@/lib/db/schema";
import { formatTimestamp } from "@/lib/utils/format";

// ─── Label mappings ──────────────────────────────────────────────────

const categoryColors: Record<string, string> = {
  model: "bg-cat-model/20 text-cat-model",
  tool: "bg-cat-tool/20 text-cat-tool",
  research: "bg-cat-research/20 text-cat-research",
  company: "bg-cat-company/20 text-cat-company",
  opensource: "bg-cat-opensource/20 text-cat-opensource",
  policy: "bg-cat-policy/20 text-cat-policy",
  market: "bg-cat-market/20 text-cat-market",
};

const itemTypeLabels: Record<string, string> = {
  model: "Model Release",
  tool: "New Tool",
  research: "Research",
  company: "Industry Move",
  opensource: "Open Source",
  policy: "Policy",
  market: "Market",
};

const paperDepthLabels: Record<string, { label: string; color: string }> = {
  general: { label: "Important Research", color: "bg-amber-500/20 text-amber-600" },
  intermediate: { label: "Notable Research", color: "bg-blue-500/20 text-blue-500" },
  advanced: { label: "Deep Research", color: "bg-purple-500/20 text-purple-500" },
};

const inclusionReasonLabels: Record<string, string> = {
  major_lab: "Major Lab",
  capability_shift: "Breakthrough",
  product_relevant: "Product Relevant",
  open_source_impact: "Open Source Impact",
  safety_alignment: "Safety & Alignment",
  community_attention: "Notable",
  efficiency_breakthrough: "Efficiency Gain",
  benchmark_record: "New Benchmark",
  agent_tool_use: "Agents & Tools",
  multimodal_advance: "Multimodal",
};

// ─── Impact tag logic ────────────────────────────────────────────────

const impactTagColors: Record<string, string> = {
  "High Impact": "bg-red-500/15 text-red-500",
  "Worth Watching": "bg-orange-500/15 text-orange-500",
};

function getImpactTag(item: Item): { label: string; color: string } | null {
  const stored = (item as any).impactTag;
  if (stored && impactTagColors[stored]) {
    return { label: stored, color: impactTagColors[stored] };
  }
  const importance = item.importanceScore ?? 50;
  const score = item.compositeScore ?? 50;
  if (importance >= 75 || score >= 80) return { label: "High Impact", color: impactTagColors["High Impact"] };
  if (importance >= 60 || score >= 65) return { label: "Worth Watching", color: impactTagColors["Worth Watching"] };
  return null;
}

// ─── Sub-components ──────────────────────────────────────────────────

function TimestampBadge({ dateStr, dateConfidence }: { dateStr: string | null | undefined; dateConfidence?: string | null }) {
  const ts = formatTimestamp(dateStr, dateConfidence);

  if (ts.unknown) {
    return (
      <span className="flex items-center gap-0.5 text-muted/60 italic" title="No publish date available">
        <HelpCircle className="h-2.5 w-2.5" />
        {ts.text}
      </span>
    );
  }

  if (ts.stale) {
    return (
      <span className="flex items-center gap-0.5 text-muted/40" title="Content is older than 2 weeks">
        <Clock className="h-2.5 w-2.5" />
        {ts.text}
      </span>
    );
  }

  if (ts.dateConfidence === "estimated") {
    return (
      <span className="text-muted" title="Publish date is estimated">
        ~{ts.text}
      </span>
    );
  }

  return <span>{ts.text}</span>;
}

// ─── Why Explanation Panel ───────────────────────────────────────────

function WhyPanel({ item }: { item: Item }) {
  if (item.implications) {
    const lines = item.implications.split("\n").filter(Boolean);
    return (
      <div className="mt-3 pt-3 border-t border-border-subtle space-y-1.5">
        {lines.map((line, i) => {
          if (line === "What is this?" || line === "Why it matters:" || line === "Who should care:") {
            return (
              <p key={i} className="text-[10px] sm:text-[11px] font-semibold text-accent uppercase tracking-wide mt-1">
                {line}
              </p>
            );
          }
          return (
            <p key={i} className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
              {line}
            </p>
          );
        })}
      </div>
    );
  }

  if (item.whyItMatters) {
    return (
      <div className="mt-3 pt-3 border-t border-border-subtle">
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Why it matters: </span>
          {item.whyItMatters}
        </p>
      </div>
    );
  }

  return null;
}

// ─── Main Card ───────────────────────────────────────────────────────

export default function ItemCard({ item }: { item: Item }) {
  const [showWhy, setShowWhy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(item.implications ?? null);

  const tags: string[] = item.tags ? JSON.parse(item.tags) : [];
  const impactTag = getImpactTag(item);

  const handleWhy = async () => {
    if (showWhy) {
      setShowWhy(false);
      return;
    }
    setShowWhy(true);

    if (!explanation && !item.implications && !item.whyItMatters) {
      setLoading(true);
      try {
        const res = await fetch(`/api/explain?id=${item.id}`);
        const data = await res.json();
        if (data.explanation) {
          setExplanation(data.explanation);
          item.implications = data.explanation;
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <article className="group rounded-2xl border border-border-subtle bg-card p-4 transition-colors hover:border-border hover:bg-card-hover sm:p-[1.125rem]">
      <div className="mb-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-medium ${
              categoryColors[item.category] ?? "bg-muted/20 text-muted-foreground"
            }`}
          >
            {(item as any).itemLabel || itemTypeLabels[item.category] || item.category}
          </span>
          {(item as any).paperDepth && paperDepthLabels[(item as any).paperDepth] && (
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-medium ${paperDepthLabels[(item as any).paperDepth].color}`}
            >
              {paperDepthLabels[(item as any).paperDepth].label}
            </span>
          )}
          {(item as any).paperInclusionReason && (item as any).paperInclusionReason !== "none" && inclusionReasonLabels[(item as any).paperInclusionReason] && (
            <span className="rounded-full bg-accent/15 px-2 py-1 text-[10px] font-medium text-accent">
              {inclusionReasonLabels[(item as any).paperInclusionReason]}
            </span>
          )}
          {impactTag && (
            <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${impactTag.color}`}>
              {impactTag.label}
            </span>
          )}
          {item.isOpenSource && (
            <span className="flex items-center gap-1 rounded-full bg-cat-opensource/15 px-2 py-1 text-[10px] font-medium text-cat-opensource">
              <Code2 className="h-2.5 w-2.5" />
              OSS
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          {item.isPrimarySource && (
            <span className="flex items-center gap-1 text-emerald-500" title="Primary/official source">
              <Shield className="h-3 w-3" />
              Primary
            </span>
          )}
          {item.company && <span className="truncate">{item.company}</span>}
          <span>{item.source}</span>
          <TimestampBadge
            dateStr={item.publishedAt ?? item.discoveredAt}
            dateConfidence={(item as any).dateConfidence}
          />
        </div>
      </div>

      <h3 className="mb-2">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-start gap-1.5 text-sm font-semibold leading-snug text-foreground transition-colors hover:text-accent sm:text-[15px]"
        >
          <span>{item.title}</span>
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-50" />
        </a>
      </h3>

      {(item.aiSummary || item.summary) && (
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground line-clamp-3 sm:line-clamp-2">
          {item.aiSummary || item.summary}
        </p>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="max-w-[10rem] truncate rounded-full bg-border/60 px-2 py-1 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-muted">+{tags.length - 3}</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleWhy}
            className={`flex min-h-10 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-medium transition-colors ${
              showWhy
                ? "bg-accent/15 text-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
            }`}
            title="Why this matters"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Why</span>
            {showWhy ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {showWhy && (
        loading ? (
          <div className="mt-3 flex items-center gap-2 border-t border-border-subtle pt-3 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating explanation...
          </div>
        ) : (
          <WhyPanel item={{ ...item, implications: explanation ?? item.implications ?? null } as Item} />
        )
      )}
    </article>
  );
}
