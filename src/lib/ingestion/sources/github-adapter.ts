import type { SourceAdapter, RawItem } from "../types";

const AI_KEYWORDS = [
  "ai", "artificial-intelligence", "machine-learning", "deep-learning",
  "llm", "large-language-model", "gpt", "transformer", "neural-network",
  "nlp", "natural-language-processing", "computer-vision", "diffusion",
  "reinforcement-learning", "rag", "embeddings", "fine-tuning",
  "langchain", "llamaindex", "autogen", "agents", "multimodal",
  "stable-diffusion", "huggingface", "pytorch", "tensorflow", "jax",
];

const AI_LANGUAGES = ["python", "jupyter notebook"];

export class GitHubAdapter implements SourceAdapter {
  id: string;
  name: string;
  type: string;

  constructor(config?: { id?: string; name?: string }) {
    this.id = config?.id ?? "github_trending";
    this.name = config?.name ?? "GitHub Trending";
    this.type = "github";
  }

  async fetch(): Promise<RawItem[]> {
    const token = process.env.GITHUB_TOKEN;

    if (token) {
      return this.fetchFromApi(token);
    }

    // Demo mode: return empty array. Demo data is seeded separately.
    console.log(
      "[github-adapter] No GITHUB_TOKEN set. Returning empty results (demo data is seeded separately)."
    );
    return [];
  }

  private async fetchFromApi(token: string): Promise<RawItem[]> {
    console.log("[github-adapter] Fetching AI/ML trending repos from GitHub API...");

    const items: RawItem[] = [];

    // Search for recently created/updated AI repos with high star counts
    const queries = [
      "topic:artificial-intelligence+stars:>100+pushed:>2026-03-18",
      "topic:llm+stars:>50+pushed:>2026-03-18",
      "topic:machine-learning+stars:>100+pushed:>2026-03-18",
    ];

    for (const q of queries) {
      try {
        const response = await globalThis.fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "AI-Intelligence-Bot/1.0",
            },
            signal: AbortSignal.timeout(15000),
          }
        );

        if (!response.ok) {
          console.error(`[github-adapter] GitHub API returned ${response.status}`);
          continue;
        }

        const data = (await response.json()) as GitHubSearchResponse;

        for (const repo of data.items ?? []) {
          if (!this.isAiRelated(repo)) continue;

          // Deduplicate by URL
          if (items.some((i) => i.url === repo.html_url)) continue;

          items.push({
            title: repo.full_name,
            url: repo.html_url,
            content: this.buildContent(repo),
            publishedAt: repo.created_at,
            metadata: {
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              language: repo.language,
              topics: repo.topics,
              openIssues: repo.open_issues_count,
              updatedAt: repo.updated_at,
            },
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[github-adapter] API query failed: ${message}`);
      }
    }

    // Deduplicate across queries
    const seen = new Set<string>();
    const unique = items.filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });

    console.log(`[github-adapter] Found ${unique.length} AI-related trending repos`);
    return unique;
  }

  private isAiRelated(repo: GitHubRepo): boolean {
    const text = [
      repo.full_name,
      repo.description ?? "",
      repo.language ?? "",
      ...(repo.topics ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return AI_KEYWORDS.some((kw) => text.includes(kw)) ||
      AI_LANGUAGES.some((lang) => (repo.language ?? "").toLowerCase() === lang);
  }

  private buildContent(repo: GitHubRepo): string {
    const parts: string[] = [];

    if (repo.description) {
      parts.push(repo.description);
    }

    parts.push(`Stars: ${repo.stargazers_count.toLocaleString()}`);
    parts.push(`Forks: ${repo.forks_count.toLocaleString()}`);

    if (repo.language) {
      parts.push(`Language: ${repo.language}`);
    }

    if (repo.topics && repo.topics.length > 0) {
      parts.push(`Topics: ${repo.topics.join(", ")}`);
    }

    return parts.join(" | ");
  }
}

// ─── GitHub API types ────────────────────────────────────────────────

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepo[];
}

interface GitHubRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  created_at: string;
  updated_at: string;
}
