import { Database, CalendarPlus, Clock3, Radio, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Stats {
  totalItems: number;
  todayItems: number;
  last3dItems?: number;
  activeSignalCount: number;
  unreadAlerts: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border-subtle bg-card/80 px-3.5 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-background/80">
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold leading-none text-foreground">
          {value.toLocaleString()}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      <StatCard
        label="Total tracked"
        value={stats.totalItems}
        icon={Database}
        color="text-accent"
      />
      <StatCard
        label="Last 24h"
        value={stats.todayItems}
        icon={CalendarPlus}
        color="text-success"
      />
      <StatCard
        label="Last 3 days"
        value={stats.last3dItems ?? 0}
        icon={Clock3}
        color="text-blue-400"
      />
      <StatCard
        label="Active signals"
        value={stats.activeSignalCount}
        icon={Radio}
        color="text-warning"
      />
      <StatCard
        label="Unread alerts"
        value={stats.unreadAlerts}
        icon={Bell}
        color="text-danger"
      />
    </div>
  );
}
