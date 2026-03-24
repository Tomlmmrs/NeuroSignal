export type RankMode = 'latest' | 'important' | 'novel' | 'impactful' | 'underrated' | 'opensource' | 'research';
export type Category = 'model' | 'tool' | 'research' | 'company' | 'opensource' | 'policy' | 'market';
export type SourceType = 'blog' | 'research' | 'news' | 'social' | 'github' | 'release';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SignalType = 'emerging_topic' | 'convergence' | 'acceleration' | 'breakout';

export interface ScoreWeights {
  importance: number;
  novelty: number;
  credibility: number;
  impact: number;
  practical: number;
  recency: number;
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  importance: 0.25,
  novelty: 0.2,
  credibility: 0.15,
  impact: 0.2,
  practical: 0.1,
  recency: 0.1,
};

export const RANK_MODE_LABELS: Record<RankMode, string> = {
  latest: 'Latest',
  important: 'Most Important',
  novel: 'Most Novel',
  impactful: 'Most Impactful',
  underrated: 'Underrated Signals',
  opensource: 'Open Source Momentum',
  research: 'Research to Watch',
};

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'model', label: 'AI Models' },
  { value: 'tool', label: 'AI Tools' },
  { value: 'research', label: 'Research' },
  { value: 'company', label: 'Companies & Labs' },
  { value: 'opensource', label: 'Open Source' },
  { value: 'policy', label: 'Policy & Regulation' },
  { value: 'market', label: 'Market & Industry' },
];

export interface Item {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceType: SourceType;
  category: Category;
  company?: string | null;
  summary?: string | null;
  publishedAt: string;
  importanceScore: number;
  noveltyScore: number;
  credibilityScore: number;
  impactScore: number;
  practicalScore: number;
  compositeScore: number;
  tags?: string[];
}
