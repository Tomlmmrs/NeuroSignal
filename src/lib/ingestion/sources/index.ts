import { db, schema } from "../../db";
import { eq } from "drizzle-orm";
import { RssAdapter } from "./rss-adapter";
import { GitHubAdapter } from "./github-adapter";
import type { SourceAdapter } from "../types";

export function getEnabledAdapters(): SourceAdapter[] {
  const sources = db
    .select()
    .from(schema.sources)
    .where(eq(schema.sources.enabled, true))
    .all();

  const adapters: SourceAdapter[] = [];

  for (const source of sources) {
    try {
      const adapter = createAdapter(source);
      if (adapter) {
        adapters.push(adapter);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[sources] Failed to create adapter for "${source.id}": ${message}`
      );
    }
  }

  return adapters;
}

function createAdapter(
  source: typeof schema.sources.$inferSelect
): SourceAdapter | null {
  switch (source.type) {
    case "rss":
      return new RssAdapter({
        id: source.id,
        name: source.name,
        url: source.url,
        type: source.type,
        category: source.category,
      });

    case "blog":
      // Blogs are treated as RSS feeds (most have RSS endpoints)
      return new RssAdapter({
        id: source.id,
        name: source.name,
        url: source.url,
        type: "blog",
        category: source.category,
      });

    case "scraper":
      // GitHub trending uses its own adapter
      if (source.id === "github_trending" || source.url.includes("github.com")) {
        return new GitHubAdapter({ id: source.id, name: source.name });
      }
      console.warn(
        `[sources] No scraper implementation for source "${source.id}"`
      );
      return null;

    case "api":
      // API sources need specific adapters; skip unimplemented ones
      console.warn(
        `[sources] API adapter not yet implemented for "${source.id}"`
      );
      return null;

    default:
      console.warn(
        `[sources] Unknown source type "${source.type}" for "${source.id}"`
      );
      return null;
  }
}
