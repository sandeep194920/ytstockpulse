# ytstockpulse

**Daily consensus of what finance YouTubers are saying about stocks — aggregated, timestamped, and searchable. Not financial advice.**

## What this is

Dozens of finance YouTube channels post stock opinions every day. Nobody has time to watch all of them. ytstockpulse scans a curated list of channels daily, uses Claude to extract structured signal from each video (which tickers were mentioned, what stance was taken, why), and surfaces it as:

- **A daily consensus view per stock** — how many channels are bullish/neutral/bearish today, and what each said
- **A mention-momentum signal** — is coverage of a stock heating up or going quiet, based on a rolling comparison of this week vs last week
- **A YouTuber leaderboard** — most active channels, ranked by activity now, by call accuracy later
- **An ELI10 explainer sidebar** — plain-English "what does this company actually do," written once by Claude per ticker, independent of any single video's spin
- **A historical highlights layer** — frozen monthly/quarterly snapshots so the product can eventually say "here's what consensus looked like on PLTR a year ago, and how it played out"

## What this is not

- **Not investment advice.** Every page carries a persistent disclaimer. This is a summary of public opinions, not analysis from licensed advisors.
- **Not a paywall-gated tip sheet.** No "subscribe to reveal the stock" tricks (looking at you, Motley Fool). If we surface a stock, we say what it is and why, free.
- **Not a real-time trading tool.** Data refreshes daily via batch job, not live.

## Tech stack (proposed — confirm before building)

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind — chosen for easy SSR/SEO on ticker pages, which is the real organic traffic driver (see `docs/seo-strategy.md`)
- **Database**: Supabase (Postgres) — free tier comfortably covers year-one volume
- **AI**: Claude API (Haiku 4.5 for classification — cheap, fast, batchable; consider Sonnet for the one-time ELI10 explainer drafts where quality matters more than cost)
- **Data ingestion**: Python scripts (`scripts/`) — YouTube Data API v3 + `youtube-transcript-api` + Anthropic SDK, same pattern as the Thinky riddle-sourcing pipeline this project is modeled after
- **New-upload detection**: YouTube WebSub/PubSubHubbub (free, push-based) instead of polling, to keep API quota low and get same-day freshness
- **Hosting**: Vercel (frontend) + Supabase (DB) — both free tier to start

## Repo structure

```
app/                      # Next.js App Router pages
  page.tsx                 # Home — "By stock" daily consensus view
  stock/[ticker]/page.tsx  # Individual stock detail page (SSR, SEO-critical)
  youtuber/[id]/page.tsx   # Individual YouTuber's call history
  leaderboard/page.tsx     # Top YouTubers, week/month/year toggle
  watchlist/page.tsx       # User's tracked stocks (expandable cards)
  submit/page.tsx          # "Suggest a channel" form

components/                # Shared UI components
  StockCard.tsx
  ConsensusBar.tsx
  MentionTimeline.tsx      # 30-day mention histogram
  ExplainerSidebar.tsx     # ELI10 sidebar, see product spec
  DisclaimerBanner.tsx

lib/
  supabase.ts               # DB client
  claude.ts                 # Anthropic SDK wrapper
  momentum.ts                # heating/cooling/steady calculation logic
  types.ts                   # Shared TypeScript types

scripts/                   # Data ingestion pipeline (Python, modeled on Thinky's scripts/)
  fetch_new_videos.py        # WebSub-triggered or polling fallback — gets new uploads per channel
  extract_transcript.py      # youtube-transcript-api wrapper
  classify_mentions.py       # Claude call: transcript -> structured {ticker, stance, reasoning}[]
  draft_explainer.py         # Claude call: one-time ELI10 explainer per new ticker
  vet_channel.py              # Claude call: is this candidate channel a good fit? (see channel quality bar)
  freeze_monthly_snapshot.py  # Closes out a month: consensus + price-since for highlights feature
  merge_mentions.py           # Inserts classified results into Supabase mentions table

docs/
  product-spec.md            # Full product vision, captured from planning conversation
  data-model.md               # Database schema
  channel-sourcing.md         # How to find/vet the first 20-30 YouTube channels
  seo-strategy.md             # Why ticker pages are the real SEO asset, not the homepage
  cost-projections.md         # API cost modeling at various scale points

CLAUDE.md                  # Instructions for Claude Code — read this first
.env.example                # Required environment variables
```

## Environment variables needed

```
ANTHROPIC_API_KEY=
YOUTUBE_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Current status

**Pre-build. This repo starts from a working HTML/React prototype** (see `docs/product-spec.md` for the full design that was validated) but no real backend, no real data pipeline, no real channel list yet. Claude Code should treat the prototype as the UI/UX source of truth and build the real Next.js + Supabase + ingestion pipeline around it.

## First milestones (suggested order)

1. Set up Next.js + Supabase skeleton, get `mentions` table schema live (see `docs/data-model.md`)
2. Port the prototype UI into real Next.js pages/components, wired to Supabase instead of sample data
3. Build `classify_mentions.py` — single-channel, single-video proof of concept: pull one real transcript, classify with Claude, insert into DB
4. Source and vet first 10 channels (see `docs/channel-sourcing.md`)
5. Get the daily batch job running end-to-end for those 10 channels
6. Add ELI10 explainer generation for the tickers that come up
7. Expand to 20-30 channels once the pipeline is proven accurate
