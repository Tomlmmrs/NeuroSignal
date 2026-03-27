import AppShell from "@/components/layout/AppShell";
import { getSourceHealth, getItemsForAdmin, getDashboardStats, getIngestionStats } from "@/lib/db/queries";
import { formatRelativeTime } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let sources, recentItems, stats, ingestionStats;
  try {
    [sources, recentItems, stats, ingestionStats] = await Promise.all([
      getSourceHealth(),
      getItemsForAdmin(50),
      getDashboardStats(true),
      getIngestionStats(),
    ]);
  } catch (err) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">Admin: Debug View</h1>
        <p className="text-red-400">Error loading admin data. Database may need initialization.</p>
        <code className="block mt-2 text-sm text-accent">npm run db:seed</code>
      </div>
    );
  }

  return (
    <AppShell unreadCount={stats.unreadAlerts}>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Source Health & Debug</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Total Items" value={stats.totalItems} />
          <StatCard label="Live Items" value={stats.totalItems - (stats.demoItemCount ?? 0)} />
          <StatCard label="Demo Items" value={stats.demoItemCount ?? 0} />
          <StatCard label="Last 24h" value={stats.todayItems} />
          <StatCard label="Last 3 Days" value={stats.last3dItems ?? 0} />
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Date Confidence Breakdown</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {ingestionStats.dateConfidenceBreakdown.map((dc) => (
              <div key={dc.confidence ?? "null"} className="rounded-2xl border border-border bg-card p-3">
                <p className="text-xs capitalize text-muted-foreground">{dc.confidence ?? "null"}</p>
                <p className="text-xl font-bold text-foreground">{dc.count}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Source Health</h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-[920px] w-full text-sm">
            <thead className="bg-card text-muted-foreground">
              <tr>
                <th className="text-left p-2">Source</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Tier</th>
                <th className="text-right p-2">Priority</th>
                <th className="text-right p-2">Live</th>
                <th className="text-right p-2">Recent (3d)</th>
                <th className="text-right p-2">Avg Fresh</th>
                <th className="text-left p-2">Last Fetch</th>
                <th className="text-right p-2">Fails</th>
                <th className="text-center p-2">Status</th>
                <th className="text-left p-2">Newest Item</th>
                <th className="text-left p-2">Last Error</th>
              </tr>
            </thead>
            <tbody>
              {sources
                .sort((a, b) => (b.sourcePriority ?? 0) - (a.sourcePriority ?? 0))
                .map((s) => {
                  const healthColor = !s.enabled ? "text-gray-500"
                    : (s.consecutiveFailures ?? 0) >= 3 ? "text-red-400"
                    : (s.consecutiveFailures ?? 0) >= 1 ? "text-yellow-400"
                    : s.liveItemCount === 0 ? "text-orange-400"
                    : "text-emerald-400";

                  const statusLabel = !s.enabled ? "Disabled"
                    : (s.consecutiveFailures ?? 0) >= 5 ? "Auto-disabled"
                    : (s.consecutiveFailures ?? 0) >= 3 ? "Failing"
                    : (s.consecutiveFailures ?? 0) >= 1 ? "Degraded"
                    : "Healthy";

                  return (
                    <tr key={s.id} className="border-t border-border-subtle hover:bg-card-hover">
                      <td className="p-2">
                        <div>
                          <span className="font-medium">{s.name}</span>
                          <span className="block text-[10px] text-muted-foreground font-mono">{s.id}</span>
                        </div>
                      </td>
                      <td className="p-2 text-xs">{s.type}</td>
                      <td className="p-2 text-xs capitalize">{(s as any).trustTier ?? "—"}</td>
                      <td className="p-2 text-right text-xs">{s.sourcePriority ?? "—"}</td>
                      <td className="p-2 text-right">
                        <span className={s.liveItemCount > 0 ? "text-emerald-400" : "text-red-400"}>
                          {s.liveItemCount}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <span className={s.recentItemCount > 0 ? "text-emerald-400" : "text-muted-foreground"}>
                          {s.recentItemCount}
                        </span>
                      </td>
                      <td className="p-2 text-right text-xs">
                        {s.avgFreshness != null ? Math.round(s.avgFreshness) : "—"}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {s.lastFetched ? formatRelativeTime(s.lastFetched) : "Never"}
                      </td>
                      <td className="p-2 text-right text-xs">
                        <span className={(s.consecutiveFailures ?? 0) > 0 ? "text-red-400" : ""}>
                          {s.consecutiveFailures ?? 0}
                        </span>
                      </td>
                      <td className={`p-2 text-center text-xs font-medium ${healthColor}`}>
                        {statusLabel}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {s.newestItem ? formatRelativeTime(s.newestItem) : "—"}
                      </td>
                      <td className="p-2 text-xs text-red-400/80 max-w-[200px] truncate">
                        {s.lastError || "—"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Per-Source Ingestion Quality</h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-card text-muted-foreground">
              <tr>
                <th className="text-left p-2">Source</th>
                <th className="text-right p-2">Total</th>
                <th className="text-right p-2">With Dates</th>
                <th className="text-right p-2">Exact Dates</th>
                <th className="text-right p-2">Avg Composite</th>
                <th className="text-right p-2">Avg Freshness</th>
                <th className="text-right p-2">Primary</th>
                <th className="text-right p-2">Duplicates</th>
              </tr>
            </thead>
            <tbody>
              {ingestionStats.sourceStats.map((ss) => (
                <tr key={ss.source} className="border-t border-border-subtle hover:bg-card-hover">
                  <td className="p-2 font-mono text-xs">{ss.source}</td>
                  <td className="p-2 text-right">{ss.total}</td>
                  <td className="p-2 text-right">
                    <span className={ss.withDates === ss.total ? "text-emerald-400" : "text-yellow-400"}>
                      {ss.withDates}
                    </span>
                    <span className="text-muted-foreground ml-0.5 text-[10px]">
                      ({ss.total > 0 ? Math.round((ss.withDates / ss.total) * 100) : 0}%)
                    </span>
                  </td>
                  <td className="p-2 text-right">{ss.withExactDates}</td>
                  <td className="p-2 text-right text-xs">{ss.avgComposite != null ? Math.round(ss.avgComposite) : "—"}</td>
                  <td className="p-2 text-right text-xs">{ss.avgFreshness != null ? Math.round(ss.avgFreshness) : "—"}</td>
                  <td className="p-2 text-right">{ss.primary}</td>
                  <td className="p-2 text-right">{ss.duplicates}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Recent Items (Debug View)</h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-[960px] w-full text-[11px]">
            <thead className="bg-card text-muted-foreground">
              <tr>
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Source</th>
                <th className="text-left p-2">Published</th>
                <th className="text-left p-2">Discovered</th>
                <th className="text-center p-2">Date Conf</th>
                <th className="text-right p-2">Composite</th>
                <th className="text-right p-2">Fresh</th>
                <th className="text-right p-2">Import</th>
                <th className="text-right p-2">Novel</th>
                <th className="text-center p-2">Primary</th>
                <th className="text-center p-2">Demo</th>
                <th className="text-center p-2">Dupe Of</th>
              </tr>
            </thead>
            <tbody>
              {recentItems.map((item) => {
                const dateConf = (item as any).dateConfidence ?? "unknown";
                const confColor = dateConf === "exact" ? "text-emerald-400"
                  : dateConf === "day" ? "text-blue-400"
                  : dateConf === "estimated" ? "text-yellow-400"
                  : "text-red-400";

                return (
                  <tr key={item.id} className="border-t border-border-subtle hover:bg-card-hover">
                    <td className="p-2 max-w-[250px] truncate">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                        {item.title}
                      </a>
                    </td>
                    <td className="p-2 font-mono">{item.source}</td>
                    <td className="p-2 text-muted-foreground">
                      {item.publishedAt ? formatRelativeTime(item.publishedAt) : <span className="text-red-400">none</span>}
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {item.discoveredAt ? formatRelativeTime(item.discoveredAt) : "—"}
                    </td>
                    <td className={`p-2 text-center capitalize ${confColor}`}>
                      {dateConf}
                    </td>
                    <td className="p-2 text-right">{item.compositeScore ?? "—"}</td>
                    <td className="p-2 text-right">{item.freshnessScore ?? "—"}</td>
                    <td className="p-2 text-right">{item.importanceScore ?? "—"}</td>
                    <td className="p-2 text-right">{item.noveltyScore ?? "—"}</td>
                    <td className="p-2 text-center">{item.isPrimarySource ? "Yes" : "—"}</td>
                    <td className="p-2 text-center">{item.isDemo ? <span className="text-yellow-400">Demo</span> : "Live"}</td>
                    <td className="p-2 text-center text-[10px] font-mono">
                      {(item as any).duplicateOf ? (item as any).duplicateOf.slice(0, 8) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Recent Fetch Logs</h2>
          <div className="space-y-4">
            {sources.filter(s => s.recentLogs.length > 0).map((s) => (
              <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium text-foreground">{s.name}</h3>
                <div className="space-y-2">
                  {s.recentLogs.map((log: any) => (
                    <div key={log.id} className="flex flex-col gap-1.5 rounded-xl border border-border-subtle bg-background/70 p-3 text-[11px] sm:flex-row sm:items-center sm:gap-3">
                      <span className={`w-12 font-medium ${log.status === "ok" ? "text-emerald-400" : log.status === "error" ? "text-red-400" : "text-yellow-400"}`}>
                        {log.status.toUpperCase()}
                      </span>
                      <span className="w-24 text-muted-foreground">{formatRelativeTime(log.fetchedAt)}</span>
                      <span className="text-foreground">{log.itemsNew} new / {log.itemsFetched} fetched</span>
                      <span className="text-muted-foreground">{log.durationMs}ms</span>
                      {log.errorMessage && (
                        <span className="max-w-[300px] truncate text-red-400/80">{log.errorMessage}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
