"use client";

import { Inbox, Loader2 } from "lucide-react";
import type { Item } from "@/lib/db/schema";
import ItemCard from "./ItemCard";

interface ItemListProps {
  items: Item[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function ItemList({ items, loading, hasMore, onLoadMore }: ItemListProps) {
  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading intelligence...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted">
        <Inbox className="h-8 w-8 mb-2" />
        <p className="text-sm">No items found</p>
        <p className="text-xs mt-1">Try adjusting your filters or check back later.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted mb-3">
        {items.length} item{items.length !== 1 && "s"}
      </p>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {hasMore && onLoadMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground bg-card border border-border rounded-md hover:bg-card-hover hover:text-foreground transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
