import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

// ─── Intelligence Items ─────────────────────────────────────────────
// The core entity: every piece of AI intelligence we track
export const items = sqliteTable(
  "items",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    url: text("url").notNull().unique(),
    source: text("source").notNull(), // e.g., "openai_blog", "arxiv", "github_trending"
    sourceType: text("source_type").notNull(), // blog, research, news, social, github, release
    publishedAt: text("published_at"), // ISO string
    discoveredAt: text("discovered_at").notNull(), // when our system found it
    category: text("category").notNull(), // model, tool, research, company, opensource, policy, market

    // Content
    summary: text("summary"),
    aiSummary: text("ai_summary"), // LLM-generated summary
    whyItMatters: text("why_it_matters"),
    whoShouldCare: text("who_should_care"),
    implications: text("implications"),
    content: text("content"), // raw content/description
    imageUrl: text("image_url"),

    // Scoring (0-100)
    importanceScore: real("importance_score").default(50),
    noveltyScore: real("novelty_score").default(50),
    credibilityScore: real("credibility_score").default(50),
    impactScore: real("impact_score").default(50),
    practicalScore: real("practical_score").default(50), // how practically useful
    compositeScore: real("composite_score").default(50), // weighted combination

    // Metadata
    entities: text("entities"), // JSON array of entity names/IDs
    tags: text("tags"), // JSON array of tags
    modelFamily: text("model_family"), // if about a model
    company: text("company"), // primary company/lab
    isOpenSource: integer("is_open_source", { mode: "boolean" }).default(false),

    // Clustering
    clusterId: text("cluster_id"),
    isOriginalSource: integer("is_original_source", { mode: "boolean" }).default(true),

    // Status
    isBookmarked: integer("is_bookmarked", { mode: "boolean" }).default(false),
    isRead: integer("is_read", { mode: "boolean" }).default(false),
    isArchived: integer("is_archived", { mode: "boolean" }).default(false),
  },
  (table) => [
    index("idx_items_published").on(table.publishedAt),
    index("idx_items_composite").on(table.compositeScore),
    index("idx_items_category").on(table.category),
    index("idx_items_source").on(table.source),
    index("idx_items_cluster").on(table.clusterId),
    index("idx_items_company").on(table.company),
    index("idx_items_bookmarked").on(table.isBookmarked),
  ]
);

// ─── Clusters ────────────────────────────────────────────────────────
// Groups of related items covering the same story/event
export const clusters = sqliteTable("clusters", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary"),
  category: text("category").notNull(),
  firstSeen: text("first_seen").notNull(),
  lastUpdated: text("last_updated").notNull(),
  itemCount: integer("item_count").default(1),
  peakScore: real("peak_score").default(50),
  trendVelocity: real("trend_velocity").default(0), // rate of new items
  entities: text("entities"), // JSON
  tags: text("tags"), // JSON
});

// ─── Sources ─────────────────────────────────────────────────────────
// Registry of data sources
export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // blog, rss, api, scraper, github
  url: text("url").notNull(),
  category: text("category").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  credibilityBase: real("credibility_base").default(70), // baseline credibility
  lastFetched: text("last_fetched"),
  lastError: text("last_error"),
  fetchIntervalMinutes: integer("fetch_interval_minutes").default(60),
  config: text("config"), // JSON: source-specific config
});

// ─── Entities ────────────────────────────────────────────────────────
// Companies, labs, models, tools, people
export const entities = sqliteTable(
  "entities",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(), // company, lab, model, tool, person
    description: text("description"),
    url: text("url"),
    logoUrl: text("logo_url"),
    aliases: text("aliases"), // JSON array
    metadata: text("metadata"), // JSON
    mentionCount: integer("mention_count").default(0),
    lastMentioned: text("last_mentioned"),
  },
  (table) => [
    index("idx_entities_type").on(table.type),
    index("idx_entities_mentions").on(table.mentionCount),
  ]
);

// ─── Signals ─────────────────────────────────────────────────────────
// Emerging patterns / early signals
export const signals = sqliteTable("signals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  signalType: text("signal_type").notNull(), // emerging_topic, convergence, acceleration, breakout
  strength: real("strength").default(0), // 0-100
  firstDetected: text("first_detected").notNull(),
  lastUpdated: text("last_updated").notNull(),
  relatedItemIds: text("related_item_ids"), // JSON array
  relatedEntities: text("related_entities"), // JSON
  tags: text("tags"), // JSON
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

// ─── User Preferences ───────────────────────────────────────────────
export const userPreferences = sqliteTable("user_preferences", {
  id: text("id").primaryKey().default("default"),
  interests: text("interests"), // JSON array of interest tags
  importanceThreshold: real("importance_threshold").default(30),
  enabledCategories: text("enabled_categories"), // JSON array
  alertSettings: text("alert_settings"), // JSON
  updatedAt: text("updated_at"),
});

// ─── Bookmarks ──────────────────────────────────────────────────────
export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id").notNull().references(() => items.id),
    note: text("note"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_bookmarks_item").on(table.itemId)]
);

// ─── Alerts ─────────────────────────────────────────────────────────
export const alerts = sqliteTable("alerts", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // model_release, benchmark, paper, funding, product
  title: text("title").notNull(),
  itemId: text("item_id").references(() => items.id),
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull(),
});

// ─── Types ──────────────────────────────────────────────────────────
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Cluster = typeof clusters.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type Entity = typeof entities.$inferSelect;
export type Signal = typeof signals.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
