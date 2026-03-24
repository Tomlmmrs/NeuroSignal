import { type Item, type RankMode, type ScoreWeights, DEFAULT_WEIGHTS } from '../types';

// ---------------------------------------------------------------------------
// Composite scoring
// ---------------------------------------------------------------------------

/**
 * Calculate a composite score (0-100) from individual dimension scores.
 */
export function calculateCompositeScore(
  item: {
    importanceScore: number;
    noveltyScore: number;
    credibilityScore: number;
    impactScore: number;
    practicalScore: number;
  },
  weights?: Partial<ScoreWeights>,
): number {
  const w: ScoreWeights = { ...DEFAULT_WEIGHTS, ...weights };

  // Normalise weights so they sum to 1 (ignore recency here – it is applied
  // externally when sorting by date).
  const dimensionSum =
    w.importance + w.novelty + w.credibility + w.impact + w.practical;

  if (dimensionSum === 0) return 0;

  const raw =
    (item.importanceScore * w.importance +
      item.noveltyScore * w.novelty +
      item.credibilityScore * w.credibility +
      item.impactScore * w.impact +
      item.practicalScore * w.practical) /
    dimensionSum;

  return Math.round(Math.min(100, Math.max(0, raw)));
}

// ---------------------------------------------------------------------------
// Mode-specific weight presets
// ---------------------------------------------------------------------------

const MODE_WEIGHTS: Record<RankMode, Partial<ScoreWeights>> = {
  latest: {
    importance: 0.15,
    novelty: 0.1,
    credibility: 0.1,
    impact: 0.1,
    practical: 0.05,
    recency: 0.5,
  },
  important: {
    importance: 0.4,
    novelty: 0.15,
    credibility: 0.2,
    impact: 0.15,
    practical: 0.05,
    recency: 0.05,
  },
  novel: {
    importance: 0.1,
    novelty: 0.5,
    credibility: 0.1,
    impact: 0.15,
    practical: 0.05,
    recency: 0.1,
  },
  impactful: {
    importance: 0.15,
    novelty: 0.1,
    credibility: 0.15,
    impact: 0.45,
    practical: 0.1,
    recency: 0.05,
  },
  underrated: {
    importance: 0.05,
    novelty: 0.45,
    credibility: 0.1,
    impact: 0.25,
    practical: 0.1,
    recency: 0.05,
  },
  opensource: {
    importance: 0.2,
    novelty: 0.2,
    credibility: 0.15,
    impact: 0.2,
    practical: 0.15,
    recency: 0.1,
  },
  research: {
    importance: 0.25,
    novelty: 0.35,
    credibility: 0.2,
    impact: 0.1,
    practical: 0.0,
    recency: 0.1,
  },
};

// ---------------------------------------------------------------------------
// Recency helpers
// ---------------------------------------------------------------------------

function recencyScore(publishedAt: string): number {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours < 1) return 100;
  if (ageHours < 6) return 95;
  if (ageHours < 12) return 90;
  if (ageHours < 24) return 80;
  if (ageHours < 48) return 65;
  if (ageHours < 72) return 50;
  if (ageHours < 168) return 30; // 7 days
  if (ageHours < 336) return 15; // 14 days
  return 5;
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/**
 * Rank a list of items according to a specific view mode.
 *
 * `userInterests` is an optional list of keywords. Items whose title contains
 * any of those keywords receive a small ranking boost.
 */
export function rankItems(
  items: Item[],
  mode: RankMode,
  userInterests?: string[],
): Item[] {
  const weights = MODE_WEIGHTS[mode];

  // Pre-filter for category-specific modes
  let pool = [...items];
  if (mode === 'opensource') {
    pool = pool.filter((i) => i.category === 'opensource');
  } else if (mode === 'research') {
    pool = pool.filter((i) => i.category === 'research');
  }

  // For "underrated" mode, penalise items that already have high importance
  // (they are not underrated).
  const scored = pool.map((item) => {
    const composite = calculateCompositeScore(item, weights);
    const recency = recencyScore(item.publishedAt);
    const recencyWeight = weights.recency ?? DEFAULT_WEIGHTS.recency;

    let score =
      composite * (1 - recencyWeight) + recency * recencyWeight;

    if (mode === 'underrated') {
      // Penalise items that already score very high on importance
      if (item.importanceScore > 80) {
        score *= 0.6;
      } else if (item.importanceScore > 60) {
        score *= 0.8;
      }
    }

    // Small boost for user-interest matches
    if (userInterests && userInterests.length > 0) {
      const titleLower = item.title.toLowerCase();
      const matched = userInterests.some((kw) =>
        titleLower.includes(kw.toLowerCase()),
      );
      if (matched) {
        score = Math.min(100, score * 1.1);
      }
    }

    return { item, score };
  });

  // For "latest" mode, primary sort is by date, with score as tiebreaker
  if (mode === 'latest') {
    scored.sort((a, b) => {
      const dateDiff =
        new Date(b.item.publishedAt).getTime() -
        new Date(a.item.publishedAt).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.score - a.score;
    });
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  return scored.map((s) => s.item);
}

// ---------------------------------------------------------------------------
// Heuristic estimators
// ---------------------------------------------------------------------------

const TIER1_SOURCES = [
  'openai',
  'google',
  'deepmind',
  'anthropic',
  'meta',
  'microsoft',
  'nvidia',
];

const MAJOR_MODEL_PATTERNS = [
  /gpt[-\s]?[5-9]/i,
  /claude[-\s]?[4-9]/i,
  /gemini[-\s]?[2-9]/i,
  /llama[-\s]?[4-9]/i,
  /mistral[-\s]?(large|next|ultra)/i,
  /o[1-9][-\s]?(pro|preview|mini)?/i,
  /sora[-\s]?[2-9]?/i,
];

const BENCHMARK_KEYWORDS = [
  'state-of-the-art',
  'state of the art',
  'sota',
  'new record',
  'surpass',
  'outperform',
  'benchmark',
  'beats human',
  'superhuman',
];

const FUNDING_KEYWORDS = [
  'raises',
  'funding',
  'series a',
  'series b',
  'series c',
  'series d',
  'valuation',
  'ipo',
  'acquisition',
  'acquired',
];

const TOOL_KEYWORDS = [
  'launches',
  'release',
  'released',
  'introduces',
  'now available',
  'open source',
  'open-source',
  'sdk',
  'api',
  'plugin',
  'extension',
];

const INCREMENTAL_KEYWORDS = [
  'update',
  'patch',
  'minor',
  'fix',
  'improvement',
  'tweak',
  'v0.',
  'beta',
];

/**
 * Estimate an importance score (0-100) based on keyword heuristics.
 */
export function estimateImportance(item: {
  title: string;
  source: string;
  sourceType: string;
  company?: string | null;
}): number {
  const title = item.title.toLowerCase();
  const source = item.source.toLowerCase();
  const company = (item.company ?? '').toLowerCase();

  let score = 50; // baseline

  // Major model release
  if (MAJOR_MODEL_PATTERNS.some((p) => p.test(title))) {
    score = Math.max(score, 90);
  }

  // Benchmark breakthroughs
  if (BENCHMARK_KEYWORDS.some((kw) => title.includes(kw))) {
    score = Math.max(score, 85);
  }

  // Funding / new company
  if (FUNDING_KEYWORDS.some((kw) => title.includes(kw))) {
    score = Math.max(score, 75);
  }

  // Tool releases
  if (TOOL_KEYWORDS.some((kw) => title.includes(kw))) {
    score = Math.max(score, 65);
  }

  // Incremental updates (cap the score)
  if (INCREMENTAL_KEYWORDS.some((kw) => title.includes(kw))) {
    score = Math.min(score, 55);
  }

  // Tier-1 source boost
  const isTier1 =
    TIER1_SOURCES.some((s) => source.includes(s)) ||
    TIER1_SOURCES.some((s) => company.includes(s));
  if (isTier1) {
    score = Math.min(100, score + 10);
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

// ---------------------------------------------------------------------------
// Novelty estimation
// ---------------------------------------------------------------------------

const NEW_MODEL_FAMILY_PATTERNS = [
  /introducing\s+\w+/i,
  /announcing\s+\w+/i,
  /meet\s+\w+/i,
  /new model/i,
  /first[-\s]ever/i,
  /world'?s?\s+first/i,
  /breakthrough/i,
];

const NEW_TOOL_CATEGORY_KEYWORDS = [
  'new category',
  'first of its kind',
  'novel approach',
  'paradigm',
  'reimagining',
  'rethinking',
  'from scratch',
  'ground up',
  'new framework',
  'new architecture',
];

const INCREMENTAL_VERSION_PATTERNS = [
  /v?\d+\.\d+\.\d+/i, // e.g. v1.2.3
  /\d+\.\d+ update/i,
  /point release/i,
  /hotfix/i,
  /patch/i,
];

const COMMENTARY_KEYWORDS = [
  'opinion',
  'analysis',
  'editorial',
  'commentary',
  'perspective',
  'what i think',
  'my take',
  'hot take',
  'thread',
  'review',
  'roundup',
  'recap',
];

/**
 * Estimate a novelty score (0-100) based on keyword heuristics.
 */
export function estimateNovelty(item: {
  title: string;
  category: string;
}): number {
  const title = item.title.toLowerCase();

  // New model family
  if (NEW_MODEL_FAMILY_PATTERNS.some((p) => p.test(title))) {
    return Math.max(90, 90 + Math.floor(Math.random() * 10));
  }

  // New category of tool
  if (NEW_TOOL_CATEGORY_KEYWORDS.some((kw) => title.includes(kw))) {
    return Math.max(80, 80 + Math.floor(Math.random() * 15));
  }

  // Commentary / opinion
  if (COMMENTARY_KEYWORDS.some((kw) => title.includes(kw))) {
    return 20 + Math.floor(Math.random() * 10);
  }

  // Incremental version
  if (INCREMENTAL_VERSION_PATTERNS.some((p) => p.test(title))) {
    return 30 + Math.floor(Math.random() * 10);
  }

  // Default: moderate novelty for research, lower for other categories
  if (item.category === 'research') {
    return 55 + Math.floor(Math.random() * 15);
  }

  return 40 + Math.floor(Math.random() * 15);
}
