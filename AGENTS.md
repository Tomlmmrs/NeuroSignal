# Repository Guidelines

## Project Overview
AI news dashboard that aggregates, scores, and ranks AI developments. Deployed on Vercel with Turso (hosted SQLite) as the database. Auto-ingests from 15+ sources every 30 minutes via GitHub Actions cron.

## Project Structure
```
src/
├── app/                     # Next.js 16 App Router
│   ├── page.tsx             # Homepage with curated feed sections
│   ├── layout.tsx           # Root layout with SEO metadata + Vercel Analytics
│   ├── proxy.ts             # Auth proxy for /admin routes (NOT middleware.ts — Next.js 16 convention)
│   ├── error.tsx             # Error boundary
│   ├── not-found.tsx         # 404 page
│   ├── loading.tsx           # Loading state
│   ├── robots.ts             # SEO robots
│   ├── (dashboard)/
│   │   ├── admin/page.tsx   # Protected admin dashboard (requires INGEST_API_KEY)
│   │   └── item/[id]/       # Item detail page
│   └── api/
│       ├── items/           # GET items, PATCH bookmark/read
│       ├── search/          # Full-text search
│       ├── topics/          # Stats, signals, trending
│       ├── alerts/          # Alerts CRUD
│       ├── explain/         # Lazy "Why this matters" generation + caching
│       └── ingest/          # POST trigger for ingestion (protected by INGEST_API_KEY)
├── components/
│   ├── layout/              # Header, Sidebar
│   ├── dashboard/           # StatsBar, SignalsPanel, TrendingPanel, TopEntities, AlertsDropdown
│   ├── items/               # ItemCard (with Why? panel, impact tags, bookmarks), ItemList
│   └── filters/             # RankModeSelector, CategoryFilter, TimeWindowFilter, ResearchDepthFilter
└── lib/
    ├── db/
    │   ├── index.ts         # Turso/libsql connection via drizzle-orm/libsql
    │   ├── schema.ts        # Drizzle schema (items, clusters, sources, entities, signals, alerts, etc.)
    │   ├── queries.ts       # ALL query functions are async (returns Promises)
    │   ├── init.ts          # Table creation + default sources (async)
    │   └── seed.ts          # Demo data seeder (async)
    ├── ingestion/
    │   ├── pipeline.ts      # Fetch → Parse → Normalize → Deduplicate → Score → Store (all async)
    │   ├── run.ts           # CLI entrypoint for manual ingestion
    │   ├── types.ts         # SourceAdapter interface, RawItem, PipelineResult
    │   └── sources/
    │       ├── index.ts     # getEnabledAdapters() — async, reads from sources table
    │       ├── rss-adapter.ts
    │       ├── github-adapter.ts
    │       └── hf-papers-adapter.ts
    ├── ranking/
    │   ├── scorer.ts        # Importance, novelty, recency, composite scoring
    │   ├── explain.ts       # Template-based "What/Why/Who" explanation generator
    │   ├── relevance.ts     # Real-world relevance scoring, item labels, impact tags
    │   └── paper-filter.ts  # Research paper scoring, depth classification, jargon rewriting
    ├── types.ts             # Shared types (Category, RankMode, TimeWindow, etc.)
    └── utils/
        ├── format.ts        # Date formatting, relative time
        ├── validate.ts      # URL normalization, date parsing, content quality
        └── cn.ts            # Tailwind class merge utility
```

## Critical: All DB Queries Are Async
The database uses `@libsql/client` (Turso) via `drizzle-orm/libsql`. **Every function in `queries.ts`, `init.ts`, `pipeline.ts`, and `sources/index.ts` is async.** Always `await` DB calls. This was migrated from synchronous `better-sqlite3` — do NOT revert to sync patterns.

## Build, Test, and Development Commands
- `npm run dev` — start with Turbopack at http://localhost:3000
- `npm run build` — production build (also runs in CI)
- `npm test` — Vitest suite (131 tests across 6 files)
- `npm run db:seed` — initialize tables + demo data in Turso DB
- `npm run db:push` / `npm run db:migrate` — apply Drizzle schema changes
- `npm run ingest` — run ingestion pipeline manually (fetches all sources)

## Environment Variables
See `.env.example`. Required for production:
- `TURSO_DATABASE_URL` — `libsql://your-db.turso.io`
- `TURSO_AUTH_TOKEN` — Turso auth token
- `INGEST_API_KEY` — protects `/api/ingest` and `/admin`
- `DEMO_MODE` — set to `false` for live data
- `NEXT_PUBLIC_SITE_URL` — your deployed URL (for OG tags)

For local dev without Turso: `TURSO_DATABASE_URL=file:./data/intelligence.db`

## Key Architecture Decisions

### Homepage: Curated Sections (not a flat feed)
`page.tsx` shows 6 sections by default: Major AI Releases, Important Developments, New Tools & Products, Open Source Momentum, Early Signals, Important Research. Switches to flat filtered view when user applies category/search/mode filters. Sections are powered by `getFeedSections()` in queries.ts.

### Scoring Pipeline
Each item gets multi-dimensional scores during ingestion:
- Importance, novelty, credibility, impact, practical (0-100 each)
- `realWorldRelevance` (0-100) — penalizes pure academic content, boosts tools/releases
- `compositeScore` — weighted blend: freshness 30%, real-world relevance 23%, importance 14%, impact 12%, novelty 8%, credibility 8%, practical 5%
- `itemLabel` — e.g. "Model Release", "New Tool", "API Update", "Safety Research"
- `impactTag` — "High Impact", "Worth Watching", "Early Signal", "Experimental", or null

### Research Paper Filtering
Research papers are scored separately via `paper-filter.ts`. Papers get `paperDepth` (general/intermediate/advanced), `showInMainFeed` (boolean), and `paperInclusionReason`. arXiv items in non-research categories get `showInMainFeed` based on relevance >= 50. Main feed caps research at ~15% of results.

### "Why This Matters" Explanations
All items get a structured explanation (What is this? / Why it matters / Who should care) generated by `explain.ts` during ingestion and stored in the `implications` field. The `/api/explain` endpoint generates on-demand for items missing explanations. `ItemCard` has a "Why?" toggle that shows this panel.

### Auth: Proxy-based (Next.js 16)
`src/proxy.ts` (NOT `middleware.ts`) protects `/admin` routes via `INGEST_API_KEY`. Access with `?key=YOUR_KEY` which sets an httpOnly cookie. The `/api/ingest` endpoint checks the same key via `x-api-key` header or `?key=` param.

### Deployment
- **Hosted on Vercel** with `output: "standalone"` in next.config.ts
- **Database**: Turso (hosted SQLite via libsql)
- **Ingestion cron**: GitHub Actions workflow (`.github/workflows/ingest.yml`) calls `POST /api/ingest` every 30 minutes
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) runs tests + build on push/PR

## Coding Style
- TypeScript strict mode, 2-space indent, double quotes, semicolons
- React components: PascalCase files (`ItemCard.tsx`)
- Utilities: camelCase files (`format.ts`)
- Tests: adjacent `*.test.ts` files
- Imports: use `@/` alias for `src/`
- Tailwind CSS 4 with dark-mode-first design

## Testing
Vitest picks up `src/**/*.test.ts`. Test files exist for:
- `ranking/scorer.test.ts` — scoring functions
- `ranking/explain.test.ts` — explanation generation
- `ranking/paper-filter.test.ts` — paper scoring/filtering
- `ranking/relevance.test.ts` — real-world relevance, labels, impact tags
- `utils/format.test.ts` — timestamp formatting
- `utils/validate.test.ts` — URL validation, date parsing

Add tests for non-trivial logic changes. Run `npm test` before committing.

## Commit & PR Guidelines
Use Conventional Commit prefixes (`feat:`, `fix:`, `docs:`, `refactor:`). PRs target `main`. Note any schema or env changes. Confirm `npm test` and `npm run build` pass.
