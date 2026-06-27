# ytstockpulse — Learning Hub

> If you're coming back to this project after time away, or want to understand how the whole system fits together — start here.

---

## What is ytstockpulse?

A Next.js web app that:
1. Tracks a curated list of finance YouTube channels
2. Pulls their video transcripts daily
3. Uses Claude (AI) to extract every specific stock opinion (buy/hold/sell + reasoning)
4. Shows the aggregated result as a daily "consensus dashboard" — what is the YouTube finance world saying about each stock today?

**The core value:** instead of watching 10 finance videos a day, you read a 2-minute summary. The product observes and reports — it never gives its own opinion.

**Tech stack:** Next.js (App Router) + TypeScript + Tailwind + Supabase (Postgres) + Anthropic Claude + Python pipeline scripts.

---

## Learning Docs Index

| Doc | What it covers |
|-----|----------------|
| [overview.md](overview.md) | The full picture — mission, what's built, how data flows, what's next |
| [pipeline.md](pipeline.md) | How the YouTube jobs run — full data flow from channel → transcript → Claude → database |
| [data-model.md](data-model.md) | The database schema, why it's shaped the way it is, and how every UI view derives from one table |
| [claude-integration.md](claude-integration.md) | How we use Claude: classification prompts, ELI10 explainers, model choices, cost decisions |
| [supabase-and-migrations.md](supabase-and-migrations.md) | How migrations work, RLS policies, and how the frontend reads data |

---

## The Mental Model (read this first)

**Everything derives from one table: `mentions`.**

Every time a YouTuber mentions a stock in a video, that's one row in `mentions`. The daily consensus, the 30-day momentum chart, the leaderboard, the YouTuber profile page — all of it is computed from queries against this one table. There's no separate "daily summary" table that could drift out of sync.

```
YouTube channel
    ↓ (YouTube Data API — fetch_new_videos.py)
Video IDs + metadata
    ↓ (youtube-transcript-api — extract_transcript.py)
Raw transcript text
    ↓ (Claude Haiku — classify_mentions.py)
[{ ticker: "NVDA", stance: "buy", reasoning: "..." }, ...]
    ↓ (Supabase — merge_mentions.py)
mentions table row
    ↓ (Next.js queries)
Dashboard / Stock page / Leaderboard
```

---

## Key Design Decisions

**Why Python for the pipeline, not TypeScript?**
The pipeline runs as a batch job, not as part of the web server. Python has better library support for YouTube transcript extraction (`youtube-transcript-api`) and the scripts are structurally identical to a proven pipeline pattern from other projects.

**Why Claude Haiku for classification?**
Classification runs once per video — potentially hundreds of times a day at scale. Haiku is the cheapest Claude model and accurate enough for structured extraction. The one place we use a more capable model (Sonnet) is for ELI10 explainers, which run once per ticker, not per video.

**Why not store the transcript?**
Copyright. We extract a short, paraphrased `reasoning` field (never a verbatim quote) and discard the raw transcript. The classification prompt explicitly enforces this.

**Why `mentioned_at` = video publish date, not scrape date?**
Because momentum and historical charts need to reflect when the YouTuber actually said something, not when our pipeline got around to processing it. A video from May 15th should show up on May 15th even if we process it in a June backfill.
