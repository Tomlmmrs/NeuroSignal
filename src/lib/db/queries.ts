import { db, schema } from "./index";
import { eq, desc, asc, like, or, and, sql, inArray } from "drizzle-orm";
import type { RankMode, Category } from "../types";

const { items, clusters, signals, entities, alerts, bookmarks, userPreferences } = schema;

// ─── Items ──────────────────────────────────────────────────────────

export interface ItemQueryOptions {
  mode?: RankMode;
  category?: Category;
  company?: string;
  isOpenSource?: boolean;
  search?: string;
  minImportance?: number;
  limit?: number;
  offset?: number;
  bookmarkedOnly?: boolean;
}

export function getItems(opts: ItemQueryOptions = {}) {
  const conditions = [];

  if (opts.category) {
    conditions.push(eq(items.category, opts.category));
  }
  if (opts.company) {
    conditions.push(eq(items.company, opts.company));
  }
  if (opts.isOpenSource !== undefined) {
    conditions.push(eq(items.isOpenSource, opts.isOpenSource));
  }
  if (opts.minImportance) {
    conditions.push(sql`${items.importanceScore} >= ${opts.minImportance}`);
  }
  if (opts.bookmarkedOnly) {
    conditions.push(eq(items.isBookmarked, true));
  }
  if (opts.search) {
    const term = `%${opts.search}%`;
    conditions.push(
      or(
        like(items.title, term),
        like(items.summary, term),
        like(items.content, term),
        like(items.tags, term),
        like(items.company, term)
      )
    );
  }

  // Mode-specific filters
  if (opts.mode === "opensource") {
    conditions.push(eq(items.isOpenSource, true));
  }
  if (opts.mode === "research") {
    conditions.push(eq(items.category, "research"));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Mode-specific ordering
  let orderBy;
  switch (opts.mode) {
    case "latest":
      orderBy = [desc(items.publishedAt)];
      break;
    case "important":
      orderBy = [desc(items.compositeScore), desc(items.importanceScore)];
      break;
    case "novel":
      orderBy = [desc(items.noveltyScore), desc(items.publishedAt)];
      break;
    case "impactful":
      orderBy = [desc(items.impactScore), desc(items.compositeScore)];
      break;
    case "underrated":
      orderBy = [desc(items.noveltyScore), asc(items.importanceScore)];
      break;
    case "opensource":
      orderBy = [desc(items.compositeScore), desc(items.publishedAt)];
      break;
    case "research":
      orderBy = [desc(items.noveltyScore), desc(items.importanceScore)];
      break;
    default:
      orderBy = [desc(items.compositeScore), desc(items.publishedAt)];
  }

  return db
    .select()
    .from(items)
    .where(where)
    .orderBy(...orderBy)
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0)
    .all();
}

export function getItemById(id: string) {
  return db.select().from(items).where(eq(items.id, id)).get();
}

export function getItemsByCluster(clusterId: string) {
  return db
    .select()
    .from(items)
    .where(eq(items.clusterId, clusterId))
    .orderBy(desc(items.publishedAt))
    .all();
}

export function toggleBookmark(itemId: string) {
  const item = getItemById(itemId);
  if (!item) return null;
  db.update(items)
    .set({ isBookmarked: !item.isBookmarked })
    .where(eq(items.id, itemId))
    .run();
  return { ...item, isBookmarked: !item.isBookmarked };
}

export function markAsRead(itemId: string) {
  db.update(items)
    .set({ isRead: true })
    .where(eq(items.id, itemId))
    .run();
}

// ─── Clusters ───────────────────────────────────────────────────────

export function getClusters(limit = 20) {
  return db
    .select()
    .from(clusters)
    .orderBy(desc(clusters.lastUpdated))
    .limit(limit)
    .all();
}

export function getClusterById(id: string) {
  return db.select().from(clusters).where(eq(clusters.id, id)).get();
}

export function getTrendingClusters(limit = 10) {
  return db
    .select()
    .from(clusters)
    .orderBy(desc(clusters.trendVelocity))
    .limit(limit)
    .all();
}

// ─── Signals ────────────────────────────────────────────────────────

export function getActiveSignals(limit = 10) {
  return db
    .select()
    .from(signals)
    .where(eq(signals.isActive, true))
    .orderBy(desc(signals.strength))
    .limit(limit)
    .all();
}

// ─── Entities ───────────────────────────────────────────────────────

export function getTopEntities(type?: string, limit = 20) {
  const conditions = type ? eq(entities.type, type) : undefined;
  return db
    .select()
    .from(entities)
    .where(conditions)
    .orderBy(desc(entities.mentionCount))
    .limit(limit)
    .all();
}

export function getEntityById(id: string) {
  return db.select().from(entities).where(eq(entities.id, id)).get();
}

// ─── Alerts ─────────────────────────────────────────────────────────

export function getAlerts(unreadOnly = false, limit = 20) {
  const where = unreadOnly ? eq(alerts.isRead, false) : undefined;
  return db
    .select()
    .from(alerts)
    .where(where)
    .orderBy(desc(alerts.createdAt))
    .limit(limit)
    .all();
}

export function getUnreadAlertCount() {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(alerts)
    .where(eq(alerts.isRead, false))
    .get();
  return result?.count ?? 0;
}

export function markAlertRead(alertId: string) {
  db.update(alerts)
    .set({ isRead: true })
    .where(eq(alerts.id, alertId))
    .run();
}

// ─── Stats ──────────────────────────────────────────────────────────

export function getDashboardStats() {
  const totalItems = db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .get()?.count ?? 0;

  const todayItems = db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(sql`date(${items.discoveredAt}) = date('now')`)
    .get()?.count ?? 0;

  const activeSignalCount = db
    .select({ count: sql<number>`count(*)` })
    .from(signals)
    .where(eq(signals.isActive, true))
    .get()?.count ?? 0;

  const unreadAlerts = getUnreadAlertCount();

  const categoryCounts = db
    .select({
      category: items.category,
      count: sql<number>`count(*)`,
    })
    .from(items)
    .groupBy(items.category)
    .all();

  return {
    totalItems,
    todayItems,
    activeSignalCount,
    unreadAlerts,
    categoryCounts,
  };
}

// ─── User Preferences ──────────────────────────────────────────────

export function getUserPreferences() {
  return db.select().from(userPreferences).where(eq(userPreferences.id, "default")).get();
}

export function updateUserPreferences(prefs: Partial<schema.UserPreferences>) {
  db.update(userPreferences)
    .set({ ...prefs, updatedAt: new Date().toISOString() })
    .where(eq(userPreferences.id, "default"))
    .run();
}

// ─── Search ─────────────────────────────────────────────────────────

export function searchItems(query: string, filters?: { category?: string; company?: string; limit?: number }) {
  return getItems({
    search: query,
    category: filters?.category as Category,
    company: filters?.company,
    limit: filters?.limit ?? 30,
  });
}

// ─── Companies ──────────────────────────────────────────────────────

export function getCompanies() {
  return db
    .select({
      company: items.company,
      count: sql<number>`count(*)`,
    })
    .from(items)
    .where(sql`${items.company} IS NOT NULL`)
    .groupBy(items.company)
    .orderBy(sql`count(*) DESC`)
    .limit(30)
    .all();
}
