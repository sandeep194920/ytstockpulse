# ytstockpulse — Project Overview

> What we built, why we built it, how it works end-to-end, and where we are today.
> Read this when you want the full picture — not a specific technical detail.

---

## The Mission

Finance YouTubers make specific stock calls every day — "buy NVDA," "AAPL is overpriced," "hold TSLA." Thousands of people watch these videos to inform their investing decisions.

The problem: there's no fast way to see what the collective YouTube finance world is saying about a stock today. You'd have to watch 10 videos to get the picture.

**ytstockpulse solves this:** we track 13+ curated finance YouTube channels, extract every specific stock call using AI, and present the aggregated result as a daily "consensus dashboard." 2 minutes to read instead of 10 videos to watch.

**The brand positioning:** "pulse" — we measure and report consensus, we don't give our own opinions. This isn't a stock picker. It's a radar for what the YouTube finance world is saying.

**Domain:** ytstockpulse.com

---

## What We've Built So Far

### The data pipeline (fully working)
- 13 vetted finance YouTube channels tracked
- Daily fetch of new videos via YouTube Data API
- Transcript extraction per video
- Claude AI classifies stock mentions (ticker, buy/hold/sell, reasoning)
- Results written to Supabase with deduplication
- Backfill from May 1st 2026 — ~57 days of historical data

### The web app (live, wired to real data)
- **Home page** — by-stock consensus view, sortable by momentum/mentions/conviction
- **By YouTuber page** — all tracked channels with subscriber counts and weekly activity
- **Stock detail page** — 30-day mention timeline, full call history, consensus bar
- **Leaderboard page** — top YouTubers by activity score (week/month/year toggle)
- **Watchlist page** — bookmarkable stocks with expandable cards
- **Submit a channel page** — community channel suggestions (goes to review queue)
- **Disclaimer system** — first-visit blocking modal + persistent banner on every page

### The channels we track
13 channels across different archetypes (value investors, growth investors, momentum traders, dividend investors) — all vetted for making specific ticker-level calls, not just vague educational content.

---

## How Data Flows (the full journey)

```
1. YouTube channel posts a video
        ↓
2. fetch_new_videos.py queries YouTube Data API
   "what has @TomNashTV uploaded since yesterday?"
        ↓
3. extract_transcript.py pulls the caption text
   "Here's the full spoken transcript..."
        ↓
4. classify_mentions.py sends transcript to Claude Haiku
   "What stocks did he mention? What stance did he take?"
   → [{ ticker: "AMZN", stance: "buy", reasoning: "Sees AWS AI revenue accelerating..." }]
        ↓
5. merge_mentions.py writes to Supabase
   One row per stock mention, with deduplication
        ↓
6. Next.js frontend queries the mentions table
   Computes consensus, momentum, leaderboard on the fly
        ↓
7. User reads the daily consensus in 2 minutes
   Instead of watching 10 videos
```

---

## How We Achieve the Mission

### "Not financial advice" — built into the structure
Three layers, not just a footer:
1. First-visit blocking modal requiring acknowledgment
2. Persistent thin banner on every page
3. Inline "opinions, not advice" marker at the point of reading actual calls

### Honest rankings
The leaderboard is activity-based (mentions + stocks covered) — not an accuracy claim. The UI says so directly. An accuracy-based ranking needs months of price-after-call data first.

### Consensus, not picks
We show what YouTubers said, with full attribution and reasoning. We never say "buy X" — we say "3 YouTubers said buy, 1 said hold."

### SEO via per-ticker pages
The growth model is organic search. People Google "NVDA stock" constantly. Daily-fresh ticker pages (`/stock/nvda`) with real data are a strong SEO asset. The homepage is not the primary traffic driver — the stock pages are.

### Free forever (core product)
The actual answer is never gated behind a paywall. Monetization (if ever pursued) would be freemium features, not locking the consensus data itself.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js (App Router), TypeScript | SSR for SEO-critical ticker pages, strong type safety |
| Styling | Tailwind CSS + IBM Plex Mono + Fraunces | Editorial, data-first aesthetic — feels like a publication, not a dashboard |
| Database | Supabase (Postgres) | Free tier, instant REST API, RLS for security |
| AI | Anthropic Claude (Haiku for classification, Sonnet for explainers) | Best-in-class instruction following for structured extraction |
| Pipeline | Python scripts | Better library support for YouTube transcript extraction |
| Hosting | Vercel (frontend) + Supabase (DB) | Both free tier at launch scale |

---

## What's Next

Roughly in priority order:

1. **Verify classification quality** — manually spot-check a sample of Claude's buy/hold/sell calls against the actual video content. Do this before scaling to more channels (principle 5 in CLAUDE.md).
2. **ELI10 explainers** — run `draft_explainer.py` for the top 20-30 tickers already in the DB. This unlocks the sidebar feature.
3. **Price data** — wire up the market data API properly so `stocks.price` and `change` are populated daily.
4. **Expand channels** — from 13 to 20-30, after the accuracy check passes.
5. **Daily cron job** — automate `fetch_new_videos.py` on a schedule (Vercel cron or GitHub Actions).
6. **Accuracy-based leaderboard** — needs months of price-after-call data. Long-term.
7. **Monetization** — explicitly deferred. Build retention first.

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Product principles, architecture, coding conventions — read before touching anything |
| `learning/pipeline.md` | How the YouTube data pipeline works |
| `learning/data-model.md` | Database schema and how UI views are derived |
| `learning/claude-integration.md` | How we use Claude, prompt design, model choices |
| `scripts/fetch_new_videos.py` | Main pipeline orchestrator |
| `scripts/classify_mentions.py` | Claude classification logic |
| `supabase/migrations/` | All schema changes, in order |
| `app/page.tsx` | Home page — by-stock consensus |
| `app/stock/[ticker]/page.tsx` | Stock detail page |
| `lib/supabase.ts` | Supabase client setup |
