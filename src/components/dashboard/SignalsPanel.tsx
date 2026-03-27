"use client";

import { formatDistanceToNow } from "date-fns";
import { Radar } from "lucide-react";
import type { Signal } from "@/lib/db/schema";

const signalTypeConfig: Record<string, { label: string; color: string; barColor: string }> = {
  emerging_topic: { label: "Emerging", color: "bg-success/20 text-success", barColor: "bg-success" },
  convergence: { label: "Convergence", color: "bg-accent/20 text-accent", barColor: "bg-accent" },
  acceleration: { label: "Acceleration", color: "bg-warning/20 text-warning", barColor: "bg-warning" },
  breakout: { label: "Breakout", color: "bg-danger/20 text-danger", barColor: "bg-danger" },
};

export default function SignalsPanel({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-card/75">
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
        <Radar className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">Early Signals</h2>
        <span className="ml-auto text-[11px] text-muted">{signals.length}</span>
      </div>

      <div className="divide-y divide-border-subtle">
        {signals.map((signal) => {
          const cfg = signalTypeConfig[signal.signalType] ?? signalTypeConfig.emerging_topic;
          return (
            <div key={signal.id} className="px-4 py-3 transition-colors hover:bg-card-hover">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-[11px] text-muted">
                  {formatDistanceToNow(new Date(signal.firstDetected), { addSuffix: true })}
                </span>
              </div>

              <h3 className="text-sm font-medium text-foreground">{signal.title}</h3>

              {signal.description && (
                <p className="mb-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {signal.description}
                </p>
              )}

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted">Strength</span>
                <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full score-bar ${cfg.barColor}`}
                    style={{ width: `${signal.strength ?? 0}%` }}
                  />
                </div>
                <span className="w-6 text-right text-[11px] text-muted-foreground">
                  {Math.round(signal.strength ?? 0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
