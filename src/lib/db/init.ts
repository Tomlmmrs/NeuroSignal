import { db } from "./index";
import { sql } from "drizzle-orm";

export function initDatabase() {
  // ─── Items table ──────────────────────────────────────────────────
  db.run(sql`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL,
      source_type TEXT NOT NULL,
      published_at TEXT,
      discovered_at TEXT NOT NULL,
      category TEXT NOT NULL,

      summary TEXT,
      ai_summary TEXT,
      why_it_matters TEXT,
      who_should_care TEXT,
      implications TEXT,
      content TEXT,
      image_url TEXT,

      importance_score REAL DEFAULT 50,
      novelty_score REAL DEFAULT 50,
      credibility_score REAL DEFAULT 50,
      impact_score REAL DEFAULT 50,
      practical_score REAL DEFAULT 50,
      composite_score REAL DEFAULT 50,

      entities TEXT,
      tags TEXT,
      model_family TEXT,
      company TEXT,
      is_open_source INTEGER DEFAULT 0,

      cluster_id TEXT,
      is_original_source INTEGER DEFAULT 1,

      is_bookmarked INTEGER DEFAULT 0,
      is_read INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0
    )
  `);

  db.run(sql`CREATE INDEX IF NOT EXISTS idx_items_published ON items(published_at)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_items_composite ON items(composite_score)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_items_source ON items(source)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_items_cluster ON items(cluster_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_items_company ON items(company)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_items_bookmarked ON items(is_bookmarked)`);

  // ─── Clusters table ───────────────────────────────────────────────
  db.run(sql`
    CREATE TABLE IF NOT EXISTS clusters (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT,
      category TEXT NOT NULL,
      first_seen TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      item_count INTEGER DEFAULT 1,
      peak_score REAL DEFAULT 50,
      trend_velocity REAL DEFAULT 0,
      entities TEXT,
      tags TEXT
    )
  `);

  // ─── Sources table ────────────────────────────────────────────────
  db.run(sql`
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      credibility_base REAL DEFAULT 70,
      last_fetched TEXT,
      last_error TEXT,
      fetch_interval_minutes INTEGER DEFAULT 60,
      config TEXT
    )
  `);

  // ─── Entities table ───────────────────────────────────────────────
  db.run(sql`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      url TEXT,
      logo_url TEXT,
      aliases TEXT,
      metadata TEXT,
      mention_count INTEGER DEFAULT 0,
      last_mentioned TEXT
    )
  `);

  db.run(sql`CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_entities_mentions ON entities(mention_count)`);

  // ─── Signals table ────────────────────────────────────────────────
  db.run(sql`
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      signal_type TEXT NOT NULL,
      strength REAL DEFAULT 0,
      first_detected TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      related_item_ids TEXT,
      related_entities TEXT,
      tags TEXT,
      is_active INTEGER DEFAULT 1
    )
  `);

  // ─── User Preferences table ───────────────────────────────────────
  db.run(sql`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY DEFAULT 'default',
      interests TEXT,
      importance_threshold REAL DEFAULT 30,
      enabled_categories TEXT,
      alert_settings TEXT,
      updated_at TEXT
    )
  `);

  // ─── Bookmarks table ─────────────────────────────────────────────
  db.run(sql`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES items(id),
      note TEXT,
      created_at TEXT NOT NULL
    )
  `);

  db.run(sql`CREATE INDEX IF NOT EXISTS idx_bookmarks_item ON bookmarks(item_id)`);

  // ─── Alerts table ────────────────────────────────────────────────
  db.run(sql`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      item_id TEXT REFERENCES items(id),
      severity TEXT NOT NULL DEFAULT 'medium',
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  // ─── Default User Preferences ─────────────────────────────────────
  db.run(sql`
    INSERT OR IGNORE INTO user_preferences (id, interests, importance_threshold, enabled_categories, alert_settings, updated_at)
    VALUES (
      'default',
      '["llm","agents","multimodal","open-source","reasoning","code-generation","safety","alignment"]',
      30,
      '["model","tool","research","company","opensource","policy","market"]',
      '{"model_release":true,"benchmark":true,"paper":true,"funding":true,"product":true,"minSeverity":"medium"}',
      ${new Date().toISOString()}
    )
  `);

  // ─── Default Sources ──────────────────────────────────────────────
  const defaultSources = [
    { id: "openai_blog", name: "OpenAI Blog", type: "blog", url: "https://openai.com/blog", category: "company", credibility: 90, interval: 30 },
    { id: "anthropic_blog", name: "Anthropic Blog", type: "blog", url: "https://www.anthropic.com/news", category: "company", credibility: 90, interval: 30 },
    { id: "google_ai_blog", name: "Google AI Blog", type: "blog", url: "https://blog.google/technology/ai/", category: "company", credibility: 88, interval: 30 },
    { id: "meta_ai_blog", name: "Meta AI Blog", type: "blog", url: "https://ai.meta.com/blog/", category: "company", credibility: 88, interval: 60 },
    { id: "arxiv_cs_ai", name: "arXiv CS.AI", type: "rss", url: "https://arxiv.org/list/cs.AI/recent", category: "research", credibility: 85, interval: 60 },
    { id: "github_trending", name: "GitHub Trending", type: "scraper", url: "https://github.com/trending", category: "opensource", credibility: 75, interval: 120 },
    { id: "hf_papers", name: "Hugging Face Papers", type: "api", url: "https://huggingface.co/papers", category: "research", credibility: 82, interval: 60 },
    { id: "techcrunch_ai", name: "TechCrunch AI", type: "rss", url: "https://techcrunch.com/category/artificial-intelligence/", category: "news", credibility: 78, interval: 30 },
    { id: "the_verge_ai", name: "The Verge AI", type: "rss", url: "https://www.theverge.com/ai-artificial-intelligence", category: "news", credibility: 78, interval: 30 },
    { id: "ars_technica_ai", name: "Ars Technica AI", type: "rss", url: "https://arstechnica.com/ai/", category: "news", credibility: 80, interval: 60 },
    { id: "mit_tech_review", name: "MIT Technology Review", type: "rss", url: "https://www.technologyreview.com/topic/artificial-intelligence/", category: "news", credibility: 88, interval: 60 },
    { id: "deepmind_blog", name: "DeepMind Blog", type: "blog", url: "https://deepmind.google/discover/blog/", category: "company", credibility: 92, interval: 60 },
  ];

  for (const s of defaultSources) {
    db.run(sql`
      INSERT OR IGNORE INTO sources (id, name, type, url, category, enabled, credibility_base, fetch_interval_minutes)
      VALUES (${s.id}, ${s.name}, ${s.type}, ${s.url}, ${s.category}, 1, ${s.credibility}, ${s.interval})
    `);
  }

  console.log("Database initialized successfully.");
}

// Allow running standalone
if (typeof require !== "undefined" && require.main === module) {
  initDatabase();
}
