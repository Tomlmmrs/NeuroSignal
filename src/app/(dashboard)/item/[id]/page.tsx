import { getDashboardStats, getItemById, getItemsByCluster } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ItemCard from "@/components/items/ItemCard";
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  Zap,
  Shield,
  Target,
  Wrench,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function ScoreBar({ label, score, icon: Icon, color }: { label: string; score: number; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-background/70">
        <Icon className={`h-4 w-4 ${color} shrink-0`} />
      </div>
      <span className="w-16 text-xs text-muted sm:w-24 sm:text-sm">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-border">
        <div
          className={`h-full rounded-full score-bar ${color.replace("text-", "bg-")}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-mono text-foreground">{Math.round(score)}</span>
    </div>
  );
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItemById(id);
  if (!item) notFound();

  const [stats] = await Promise.all([
    getDashboardStats(),
  ]);
  const relatedItems = item.clusterId
    ? (await getItemsByCluster(item.clusterId)).filter(i => i.id !== item.id)
    : [];

  const tags: string[] = item.tags ? JSON.parse(item.tags) : [];

  return (
    <AppShell unreadCount={stats.unreadAlerts}>
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground sm:mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="rounded-2xl border border-border-subtle bg-card p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="rounded-full bg-cat-model/20 px-3 py-1 text-xs font-medium text-cat-model">
                  {item.category}
                </span>
                <span className="text-xs text-muted">{item.source}</span>
                {item.isOpenSource && (
                  <span className="rounded-full bg-success/20 px-3 py-1 text-xs font-medium text-success">
                    Open Source
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{item.title}</h1>
              {item.company && (
                <p className="mt-2 text-sm text-muted">{item.company}</p>
              )}
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 self-start rounded-xl border border-border px-3 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
              Source
            </a>
          </div>

          <div className="mt-5 sm:mt-6 space-y-2.5">
            <ScoreBar label="Importance" score={item.importanceScore ?? 50} icon={Zap} color="text-warning" />
            <ScoreBar label="Novelty" score={item.noveltyScore ?? 50} icon={TrendingUp} color="text-accent" />
            <ScoreBar label="Impact" score={item.impactScore ?? 50} icon={Target} color="text-critical" />
            <ScoreBar label="Credibility" score={item.credibilityScore ?? 50} icon={Shield} color="text-success" />
            <ScoreBar label="Practical" score={item.practicalScore ?? 50} icon={Wrench} color="text-cat-tool" />
          </div>
        </div>

        {(item.aiSummary || item.summary) && (
          <div className="mt-4 rounded-2xl border border-border-subtle bg-card p-4 sm:p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-muted">Summary</h2>
            <p className="text-foreground leading-relaxed text-sm sm:text-base">{item.aiSummary || item.summary}</p>
          </div>
        )}

        {(item.whyItMatters || item.whoShouldCare || item.implications) && (
          <div className="mt-4 space-y-4 rounded-2xl border border-border-subtle bg-card p-4 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted">Intelligence Analysis</h2>
            {item.whyItMatters && (
              <div>
                <h3 className="text-sm font-medium text-accent mb-1">Why It Matters</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{item.whyItMatters}</p>
              </div>
            )}
            {item.whoShouldCare && (
              <div>
                <h3 className="text-sm font-medium text-accent mb-1">Who Should Care</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{item.whoShouldCare}</p>
              </div>
            )}
            {item.implications && (
              <div>
                <h3 className="text-sm font-medium text-accent mb-1">Implications</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{item.implications}</p>
              </div>
            )}
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {relatedItems.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 border-b border-border-subtle pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted">Related Coverage</h2>
            </div>
            <div className="space-y-3">
              {relatedItems.map((related) => (
                <ItemCard key={related.id} item={related} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
