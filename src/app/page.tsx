import AppShell from "@/components/layout/AppShell";
import StatsBar from "@/components/dashboard/StatsBar";
import ItemList from "@/components/items/ItemList";
import SignalsPanel from "@/components/dashboard/SignalsPanel";
import TrendingPanel from "@/components/dashboard/TrendingPanel";
import TopEntities from "@/components/dashboard/TopEntities";
import RankModeSelector from "@/components/filters/RankModeSelector";
import CategoryFilter from "@/components/filters/CategoryFilter";
import TimeWindowFilter from "@/components/filters/TimeWindowFilter";
import ResearchDepthFilter from "@/components/filters/ResearchDepthFilter";
import {
  getActiveSignals,
  getDashboardStats,
  getFeedSections,
  getItems,
  getTopEntities,
  getTrendingClusters,
} from "@/lib/db/queries";
import type { Category, RankMode, TimeWindow } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    mode?: string;
    category?: string;
    company?: string;
    q?: string;
    view?: string;
    t?: string;
    depth?: string;
  }>;
}

function FeedSection({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: any[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    if (!emptyMessage) return null;

    return (
      <section className="rounded-2xl border border-dashed border-border bg-card/40 p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
          Feed Section
        </p>
        <h2 className="mt-2 text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="flex items-end justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
            Feed Section
          </p>
          <h2 className="mt-2 text-base font-semibold text-foreground sm:text-lg">{title}</h2>
        </div>
        <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {items.length}
        </span>
      </div>
      <ItemList items={items} showCount={false} />
    </section>
  );
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const mode = (params.view || params.mode || "latest") as RankMode;
  const category = params.category as Category | undefined;
  const company = params.company || undefined;
  const search = params.q || undefined;
  const timeWindow = (params.t || "3d") as TimeWindow;
  const paperDepth = params.depth as "general" | "intermediate" | "advanced" | undefined;

  const isFilteredView = !!(
    category ||
    company ||
    search ||
    mode === "research" ||
    mode === "opensource" ||
    mode === "novel" ||
    mode === "impactful" ||
    mode === "underrated"
  );

  let stats: any;
  let signalsList: any;
  let trending: any;
  let topEntitiesList: any;
  let sections: any = null;
  let items: any[] = [];

  try {
    [stats, signalsList, trending, topEntitiesList] = await Promise.all([
      getDashboardStats(),
      getActiveSignals(8),
      getTrendingClusters(8),
      getTopEntities(undefined, 12),
    ]);

    if (isFilteredView) {
      items = await getItems({
        mode,
        category,
        company,
        search,
        limit: 40,
        timeWindow,
        paperDepth,
      });
    } else {
      sections = await getFeedSections(timeWindow);
    }
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-lg rounded-xl border border-border bg-card p-6 text-center sm:p-8">
          <h1 className="mb-4 text-2xl font-bold text-foreground">AI Intelligence</h1>
          <p className="mb-6 text-muted">Database not initialized. Run the setup command:</p>
          <code className="block rounded-lg bg-background px-4 py-3 text-sm text-accent">
            npm run db:seed
          </code>
        </div>
      </div>
    );
  }

  return (
    <AppShell unreadCount={stats.unreadAlerts}>
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          <StatsBar stats={stats} />

          <section className="rounded-2xl border border-border-subtle bg-card/65 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
                  Feed Controls
                </p>
                <div className="mt-3">
                  <RankModeSelector />
                </div>
              </div>
              <div className="min-w-0 lg:max-w-[20rem]">
                <TimeWindowFilter />
              </div>
            </div>

            {isFilteredView && (
              <div className="mt-3 border-t border-border-subtle pt-3">
                <CategoryFilter />
                {mode === "research" && (
                  <div className="mt-3">
                    <ResearchDepthFilter />
                  </div>
                )}
              </div>
            )}

            {search && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-background/80 px-3 py-2.5 text-sm">
                <span className="text-muted">Results for</span>
                <span className="min-w-0 truncate font-medium text-foreground">
                  &quot;{search}&quot;
                </span>
                <span className="shrink-0 text-muted-foreground">{items.length}</span>
              </div>
            )}
          </section>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-8">
          <div className="min-w-0">
            {sections && (
              <div className="space-y-8 sm:space-y-10">
                <FeedSection title="Major AI Releases" items={sections.releases} />
                <FeedSection title="Important Developments" items={sections.developments} />
                <FeedSection title="New Tools & Products" items={sections.tools} />
                <FeedSection title="Open Source Momentum" items={sections.opensource} />
                <FeedSection title="Early Signals" items={sections.signals} />
                <FeedSection title="Important Research" items={sections.research} />

                {Object.values(sections).every((sectionItems: any) => sectionItems.length === 0) && (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
                    <p className="text-sm text-muted-foreground">
                      No items found in this time window. Try expanding the time range.
                    </p>
                  </div>
                )}
              </div>
            )}

            {isFilteredView && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
                      Filtered Feed
                    </p>
                    <h2 className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                      {search ? "Search Results" : "Live Intelligence Feed"}
                    </h2>
                  </div>
                  <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                {items.length === 0 && !search ? (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
                    <p className="text-sm text-muted-foreground">
                      No items found. Try expanding the time range.
                    </p>
                  </div>
                ) : (
                  <ItemList items={items} showCount={false} />
                )}
              </div>
            )}
          </div>

          <aside className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:content-start xl:gap-6">
            <SignalsPanel signals={signalsList} />
            <TrendingPanel clusters={trending} />
            <TopEntities entities={topEntitiesList} />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
