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
    <div className="bg-card border border-border-subtle rounded-lg">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border-subtle">
        <Radar className="h-4 w-4 text-accent" />
        <h2 className="text-xs font-semibold text-foreground">Early Signals</h2>
        <span className="ml-auto text-[10px] text-muted">{signals.length}</span>
      </div>

      <div className="divide-y divide-border-subtle">
        {signals.map((signal) => {
          const cfg = signalTypeConfig[signal.signalType] ?? signalTypeConfig.emerging_topic;
          return (
            <div key={signal.id} className="px-3.5 py-2.5 hover:bg-card-hover transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-[10px] text-muted">
                  {formatDistanceToNow(new Date(signal.firstDetected), { addSuffix: true })}
                </span>
              </div>

              <h3 className="text-xs font-medium text-foreground mb-1">{signal.title}</h3>

              {signal.description && (
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-1.5">
                  {signal.description}
                </p>
              )}

              {/* Strength meter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted">Strength</span>
                <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full score-bar ${cfg.barColor}`}
                    style={{ width: `${signal.strength ?? 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-5 text-right">
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
