"use client";

import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import type { Alert } from "@/lib/db/schema";

const severityColors: Record<string, string> = {
  critical: "bg-danger",
  high: "bg-high",
  medium: "bg-medium",
  low: "bg-low",
};

export default function AlertsDropdown({
  alerts,
  unreadCount,
}: {
  alerts: Alert[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = async (alert: Alert) => {
    if (alert.isRead || readIds.has(alert.id)) return;
    setReadIds((prev) => new Set(prev).add(alert.id));
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alert.id, isRead: true }),
      });
    } catch {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(alert.id);
        return next;
      });
    }
  };

  const effectiveUnread = unreadCount - readIds.size;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-md hover:bg-card-hover transition-colors"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {effectiveUnread > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold bg-danger text-white rounded-full">
            {effectiveUnread > 99 ? "99+" : effectiveUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-card border border-border rounded-lg shadow-xl shadow-black/30 z-50 overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-border-subtle flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground">Alerts</h3>
            {effectiveUnread > 0 && (
              <span className="text-[10px] text-muted">{effectiveUnread} unread</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border-subtle">
            {alerts.length === 0 ? (
              <div className="px-3.5 py-6 text-center text-xs text-muted">
                No alerts
              </div>
            ) : (
              alerts.map((alert) => {
                const isRead = alert.isRead || readIds.has(alert.id);
                const sevColor = severityColors[alert.severity] ?? severityColors.low;
                return (
                  <button
                    key={alert.id}
                    onClick={() => handleMarkRead(alert)}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-card-hover transition-colors ${
                      isRead ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${sevColor}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {alert.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted capitalize">
                            {alert.severity}
                          </span>
                          <span className="text-[10px] text-muted">
                            {formatDistanceToNow(new Date(alert.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                      {!isRead && (
                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
