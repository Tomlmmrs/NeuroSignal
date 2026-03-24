"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, Search, Bell, Settings } from "lucide-react";

export default function Header({ unreadCount = 0 }: { unreadCount?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const handleSearch = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const params = new URLSearchParams(searchParams.toString());
        if (query.trim()) {
          params.set("q", query.trim());
        } else {
          params.delete("q");
        }
        router.push(`/?${params.toString()}`);
      }
    },
    [query, searchParams, router]
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md border-b border-border">
      {/* Left: Logo */}
      <div className="flex items-center gap-2.5 min-w-[200px]">
        <Activity className="h-5 w-5 text-accent" />
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold tracking-wider text-foreground">
            AI INTELLIGENCE
          </span>
          <span className="text-xs text-muted hidden sm:inline">
            Signal over noise
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            type="text"
            placeholder="Search intelligence..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full h-8 pl-8 pr-3 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 min-w-[100px] justify-end">
        <button className="relative p-2 rounded-md hover:bg-card-hover transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold bg-danger text-white rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        <button className="p-2 rounded-md hover:bg-card-hover transition-colors">
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
