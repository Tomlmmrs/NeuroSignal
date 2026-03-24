import { randomUUID } from "crypto";
import { db, schema } from "../db";
import { eq, sql } from "drizzle-orm";
import type { NewItem } from "../db/schema";
import type { SourceAdapter, RawItem, PipelineResult } from "./types";
import type { Category, SourceType } from "../types";
import { getEnabledAdapters } from "./sources";

// ─── Category Detection ──────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  model: [
    "model", "llm", "gpt", "claude", "gemini", "llama", "mistral", "falcon",
    "parameter", "fine-tune", "finetune", "checkpoint", "weights", "foundation model",
    "language model", "multimodal", "vision model", "diffusion",
  ],
  tool: [
    "tool", "framework", "library", "sdk", "api", "plugin", "extension",
    "platform", "app", "application", "chatbot", "assistant", "copilot",
    "langchain", "llamaindex", "autogen", "crewai",
  ],
  research: [
    "paper", "arxiv", "research", "study", "findings", "benchmark", "evaluation",
    "dataset", "experiment", "novel approach", "state-of-the-art", "sota",
    "transformer", "attention", "architecture", "preprint",
  ],
  company: [
    "openai", "anthropic", "google", "meta", "microsoft", "nvidia", "deepmind",
    "startup", "funding", "acquisition", "hire", "valuation", "series",
    "raised", "founded", "ceo", "partnership",
  ],
  opensource: [
    "open source", "open-source", "opensource", "github", "hugging face",
    "huggingface", "apache", "mit license", "repository", "repo", "fork",
    "contributor", "community", "release",
  ],
  policy: [
    "regulation", "policy", "law", "government", "eu", "congress", "senate",
    "safety", "alignment", "ethics", "bias", "responsible", "governance",
    "executive order", "legislation", "compliance",
  ],
  market: [
    "market", "revenue", "growth", "investment", "ipo", "stock", "valuation",
    "enterprise", "adoption", "industry", "forecast", "billion", "million",
    "partnership", "deal", "contract",
  ],
};

// ─── Company Extraction ──────────────────────────────────────────────
const KNOWN_COMPANIES = [
  "OpenAI", "Anthropic", "Google", "DeepMind", "Meta", "Microsoft", "NVIDIA",
  "Apple", "Amazon", "Hugging Face", "Mistral", "Cohere", "Stability AI",
  "Inflection", "Databricks", "Snowflake", "xAI", "Perplexity", "Midjourney",
  "Adobe", "Salesforce", "Baidu", "Alibaba", "ByteDance", "Samsung",
];

// ─── Open Source Detection ───────────────────────────────────────────
const OPEN_SOURCE_KEYWORDS = [
  "open source", "open-source", "opensource", "apache license", "mit license",
  "gpl", "cc-by", "public domain", "github.com", "huggingface.co/models",
  "weights released", "model weights", "open weights",
];

// ─── Helpers ─────────────────────────────────────────────────────────

function detectCategory(title: string, content: string): Category {
  const text = `${title} ${content}`.toLowerCase();
  let bestCategory: Category = "tool";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as Category;
    }
  }

  return bestCategory;
}

function extractCompany(title: string, content: string): string | null {
  const text = `${title} ${content}`;
  for (const company of KNOWN_COMPANIES) {
    if (text.toLowerCase().includes(company.toLowerCase())) {
      return company;
    }
  }
  return null;
}

function detectOpenSource(title: string, content: string, url: string): boolean {
  const text = `${title} ${content} ${url}`.toLowerCase();
  return OPEN_SOURCE_KEYWORDS.some((kw) => text.includes(kw));
}

function extractTags(title: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "and", "but", "or",
    "not", "no", "nor", "so", "yet", "both", "either", "neither", "each",
    "every", "all", "any", "few", "more", "most", "other", "some", "such",
    "than", "too", "very", "just", "about", "its", "it", "this", "that",
    "these", "those", "new", "how", "what", "why", "when", "where", "who",
  ]);

  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 8);
}

// ─── Scoring ─────────────────────────────────────────────────────────
// Heuristic-based scoring until the ranking/scorer module is built.
// TODO: Replace with import from ../ranking/scorer when available.

const HIGH_IMPORTANCE_KEYWORDS = [
  "breakthrough", "state-of-the-art", "sota", "outperforms", "surpasses",
  "revolutionary", "first", "largest", "fastest", "billion", "launch",
  "release", "announce", "gpt-5", "gpt-4", "claude", "gemini",
];

const HIGH_NOVELTY_KEYWORDS = [
  "novel", "new approach", "first-ever", "unprecedented", "never before",
  "introduces", "proposes", "invention", "paradigm", "emergent",
];

function estimateImportance(title: string, content: string): number {
  const text = `${title} ${content}`.toLowerCase();
  let score = 50;

  for (const kw of HIGH_IMPORTANCE_KEYWORDS) {
    if (text.includes(kw)) score += 5;
  }

  // Boost for known major companies
  const majorCompanies = ["openai", "anthropic", "google", "meta", "deepmind"];
  if (majorCompanies.some((c) => text.includes(c))) score += 8;

  return Math.min(100, Math.max(0, score));
}

function estimateNovelty(title: string, content: string): number {
  const text = `${title} ${content}`.toLowerCase();
  let score = 50;

  for (const kw of HIGH_NOVELTY_KEYWORDS) {
    if (text.includes(kw)) score += 6;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateComposite(scores: {
  importance: number;
  novelty: number;
  credibility: number;
  impact: number;
  practical: number;
}): number {
  return (
    scores.importance * 0.25 +
    scores.novelty * 0.2 +
    scores.credibility * 0.15 +
    scores.impact * 0.2 +
    scores.practical * 0.1 +
    // Recency bonus is handled at query time, so allocate the 0.1 weight evenly
    ((scores.importance + scores.novelty) / 2) * 0.1
  );
}

// ─── Normalize ───────────────────────────────────────────────────────

function normalize(raw: RawItem, adapter: SourceAdapter): NewItem {
  const now = new Date().toISOString();
  const content = raw.content ?? "";
  const category = detectCategory(raw.title, content);
  const company = extractCompany(raw.title, content);
  const isOpenSource = detectOpenSource(raw.title, content, raw.url);
  const tags = extractTags(raw.title);

  const importance = estimateImportance(raw.title, content);
  const novelty = estimateNovelty(raw.title, content);
  const credibility = 65; // default baseline; refined later per-source
  const impact = Math.round((importance + novelty) / 2);
  const practical = 50;

  const composite = calculateComposite({
    importance,
    novelty,
    credibility,
    impact,
    practical,
  });

  return {
    id: randomUUID(),
    title: raw.title.trim(),
    url: raw.url.trim(),
    source: adapter.id,
    sourceType: adapter.type as SourceType,
    publishedAt: raw.publishedAt ?? now,
    discoveredAt: now,
    category,
    content,
    imageUrl: raw.imageUrl ?? null,
    summary: content.length > 200 ? content.slice(0, 200) + "..." : content || null,
    importanceScore: importance,
    noveltyScore: novelty,
    credibilityScore: credibility,
    impactScore: impact,
    practicalScore: practical,
    compositeScore: Math.round(composite * 100) / 100,
    company,
    isOpenSource: isOpenSource,
    tags: JSON.stringify(tags),
    entities: JSON.stringify(company ? [company] : []),
  };
}

// ─── Pipeline ────────────────────────────────────────────────────────

export async function runPipeline(adapter: SourceAdapter): Promise<PipelineResult> {
  const result: PipelineResult = {
    source: adapter.id,
    fetched: 0,
    new: 0,
    updated: 0,
    errors: [],
  };

  console.log(`[pipeline] Starting fetch for source: ${adapter.id} (${adapter.name})`);

  // 1. Fetch raw items
  let rawItems: RawItem[];
  try {
    rawItems = await adapter.fetch();
    result.fetched = rawItems.length;
    console.log(`[pipeline] Fetched ${rawItems.length} items from ${adapter.id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.errors.push(`Fetch failed: ${message}`);
    console.error(`[pipeline] Fetch failed for ${adapter.id}: ${message}`);

    // Record error on the source
    try {
      db.update(schema.sources)
        .set({ lastError: message })
        .where(eq(schema.sources.id, adapter.id))
        .run();
    } catch {
      // Ignore DB errors during error recording
    }
    return result;
  }

  // 2. Process each item
  for (const raw of rawItems) {
    try {
      // Check for duplicate by URL
      const existing = db
        .select({ id: schema.items.id })
        .from(schema.items)
        .where(eq(schema.items.url, raw.url.trim()))
        .get();

      if (existing) {
        // Item already exists; skip for now (could update scores later)
        result.updated += 0;
        continue;
      }

      // Normalize and insert
      const item = normalize(raw, adapter);
      db.insert(schema.items).values(item).run();
      result.new++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`Item "${raw.title}": ${message}`);
      console.error(`[pipeline] Error processing item "${raw.title}": ${message}`);
    }
  }

  // 3. Update source lastFetched timestamp
  try {
    db.update(schema.sources)
      .set({
        lastFetched: new Date().toISOString(),
        lastError: null,
      })
      .where(eq(schema.sources.id, adapter.id))
      .run();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.errors.push(`Failed to update source timestamp: ${message}`);
  }

  console.log(
    `[pipeline] Completed ${adapter.id}: ${result.new} new, ${result.updated} updated, ${result.errors.length} errors`
  );

  return result;
}

export async function runAllSources(): Promise<PipelineResult[]> {
  console.log("[pipeline] Starting full ingestion run...");

  const adapters = getEnabledAdapters();
  console.log(`[pipeline] Found ${adapters.length} enabled source(s)`);

  const results: PipelineResult[] = [];

  for (const adapter of adapters) {
    const pipelineResult = await runPipeline(adapter);
    results.push(pipelineResult);
  }

  const totalNew = results.reduce((sum, r) => sum + r.new, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  console.log(
    `[pipeline] Full run complete: ${totalNew} new items, ${totalErrors} errors across ${results.length} sources`
  );

  return results;
}
