# ytstockpulse — Daily YouTuber Stock Consensus

## Mission

ytstockpulse's mission is to be the **definitive daily aggregator of finance YouTuber stock opinions** — sourcing from a curated, vetted list of 20-30 channels that make specific, ticker-level calls (not vague "diversify your portfolio" content). Not analyst ratings (TipRanks owns that). Not our own opinions (Motley Fool's lane, and not one we want). Just an honest, fast, free summary of what the YouTube finance world is actually saying today, with full mention history so patterns over time are visible.

Growth model: **SEO via per-ticker pages** (people search "NVDA stock" constantly; daily-fresh, real-data ticker pages are a strong organic asset) + **word of mouth from time saved** (the core pitch is "stop watching 10 videos a day, read this in 2 minutes").

**Domain: ytstockpulse.com.** Name chosen deliberately over "...picks" or "...reco" — "pulse" frames the product as measurement/monitoring, not as us or the YouTubers telling anyone what to buy. This isn't just a legal nicety, it's the actual brand promise: we observe and report consensus, we don't pick.

---

## What This App Is

ytstockpulse is a Next.js web app (TypeScript, Tailwind, Supabase backend) that runs a daily ingestion pipeline against a curated list of YouTube finance channels, uses Claude to extract structured stock calls from each video's transcript, and presents the aggregated result as a fast, scannable dashboard.

**Current status: pre-build.** A validated HTML/React prototype exists (see `docs/product-spec.md`) covering all core views — by-stock, by-YouTuber, leaderboard, watchlist, ELI10 explainer sidebar, submit-a-channel form, disclaimer system. No real backend, no live channel list, no production data pipeline yet. This is the starting point for a real build.

**Monetization**: not active yet. Long-term candidates (freemium subscription, no ads in the trust-sensitive core product, possible later API/data licensing) are noted in `docs/product-spec.md` but explicitly deferred — build the free product first, get organic retention, monetize once people come back without being paid to.

---

## Core Product Principles (read before building anything)

These came directly from extensive product planning and should override any default assumption that conflicts with them:

1. **Never gate the actual answer behind a subscription.** This was explicitly called out as the #1 anti-pattern to avoid (Motley Fool's "subscribe to reveal the stock" trick). If we show a stock was mentioned, we show which stock, by whom, and why — free, always.
2. **"Not financial advice" is structural, not a footnote.** Three layers required on every build: (a) first-visit modal requiring acknowledgment, (b) persistent thin banner on every page, (c) inline "opinions, not advice" marker at the point where someone reads actual stock calls. See `components/DisclaimerBanner.tsx` and the modal pattern in the prototype.
3. **Rankings must be honest about what they measure.** The YouTuber leaderboard is activity-based (mentions + stocks covered) in v1 — explicitly NOT an accuracy claim. The UI must say so directly ("an accuracy-based ranking is coming once we have enough price history"). Do not silently imply accuracy from an activity metric.
4. **Explainer content (ELI10 sidebar) is Claude-drafted once per ticker, cached — never sourced from a single YouTuber's framing.** This is deliberately separate from the daily mention pipeline. A stock's "what does this company do" should be stable and neutral; a YouTuber's "why I'm bullish today" is dynamic and opinionated. Don't conflate the two data sources.
5. **Stance classification needs a real accuracy check before scaling channel count.** Before going from a handful of pilot channels to the full 20-30, manually verify Claude's buy/hold/sell classification against a sample of real transcripts. Wrong classifications are worse than no classifications for a product whose entire value prop is trustworthy aggregation.
6. **If/when paid channel placement is ever introduced, it must be visually disclosed and never affect the underlying mention/consensus data.** Paid visibility (if pursued, not currently planned) must be a clearly separate, labeled lane — never blended into the "honest consensus" signal itself.

---

## Stack

- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (Postgres)
- **AI**: Anthropic API — Claude Haiku 4.5 for daily classification (cheap, batchable), consider Sonnet for one-time higher-stakes content like ELI10 explainers
- **Data ingestion**: Python (`scripts/`), mirroring the Thinky riddle-sourcing pipeline architecture (`scrape -> classify -> filter -> merge`, with resumable progress-tracking JSON files)
- **New-video detection**: YouTube WebSub/PubSubHubbub (free, push notification per channel) preferred over polling; polling fallback acceptable for MVP
- **Hosting**: Vercel (frontend), Supabase (DB), both free tier at launch scale

---

## Project Structure

```
app/
  page.tsx                   # Home — "By stock" daily consensus, sortable by momentum/mentions/conviction
  stock/[ticker]/page.tsx    # Stock detail: 30-day mention timeline, full call history, ELI10 sidebar trigger
  youtuber/[id]/page.tsx     # Single YouTuber's full call history, most recent first
  leaderboard/page.tsx       # Top YouTubers by week/month/year, activity-based score (see principle 3)
  watchlist/page.tsx         # User's tracked stocks, expandable cards, sortable (popularity/momentum/conviction/A-Z)
  submit/page.tsx            # "Suggest a channel" form -> review queue, not auto-added

components/
  StockListRow.tsx
  ConsensusBar.tsx            # buy/hold/sell proportional bar
  MentionTimeline.tsx         # 30-day histogram, today = darkest bar
  MomentumBadge.tsx           # heating/cooling/steady, derived from 7d vs prior-7d mention count
  ExplainerSidebar.tsx        # ELI10 panel: what it does / why in demand / backstory / related stocks in stack
  DisclaimerModal.tsx         # first-visit blocking modal
  DisclaimerBanner.tsx        # persistent thin strip under nav
  LeaderboardRow.tsx
  SubmitChannelForm.tsx

lib/
  supabase.ts                 # DB client (server + client variants)
  claude.ts                    # Anthropic SDK wrapper, model selection logic
  momentum.ts                  # heating/cooling/steady calculation (7d count vs prior 7d count)
  daysSince.ts                  # date math helper, mirrors prototype's daysAgo/daysSince pattern
  types.ts                      # Mention, Stock, Youtuber, ExplainerContent, LeaderboardEntry

scripts/
  fetch_new_videos.py          # WebSub webhook handler or polling fallback per tracked channel
  extract_transcript.py        # youtube-transcript-api wrapper, handles missing/disabled captions gracefully
  classify_mentions.py         # Claude call: transcript text -> [{ticker, stance, reasoning}], structured JSON output
  vet_channel.py                # Claude call on a channel's recent videos: ticker-specific calls? red flags (undisclosed sponsorship language, guaranteed-return claims)?
  draft_explainer.py            # Claude call, one-time per new ticker: ELI10 what/why/backstory/related-stocks
  freeze_monthly_snapshot.py    # End-of-month job: top stocks by net conviction + price performance since, for future highlights feature
  merge_mentions.py             # Validated classification results -> Supabase mentions table
  requirements.txt

docs/
  product-spec.md              # Full product vision (see below — this is the most important doc to read first)
  data-model.md
  channel-sourcing.md
  seo-strategy.md
  cost-projections.md

.env.example
package.json
```

---

## Data Model (summary — full schema in `docs/data-model.md`)

The entire product derives from one core table. Get this right first.

```sql
-- Every single mention is its own row. Daily view, weekly view, momentum,
-- leaderboards, and historical highlights are ALL derived queries against this table.
-- Do not pre-aggregate into a "daily summary" table as the primary store — the raw
-- log is the source of truth, aggregates are computed views or periodic snapshots.

mentions (
  id              uuid primary key,
  stock_ticker    text references stocks(ticker),
  youtuber_id     uuid references youtubers(id),
  video_id        text,            -- YouTube video ID, for dedup + linking back
  video_url       text,
  mentioned_at    timestamptz,     -- video publish date, NOT scrape date
  stance          text,            -- 'buy' | 'hold' | 'sell' (UI label: 'Overpriced', not 'Sell' — see prototype copy)
  reasoning       text,            -- short extracted summary, NOT a verbatim transcript quote (copyright)
  created_at      timestamptz default now()
)

stocks (
  ticker          text primary key,
  name            text,
  sector          text,
  -- price/change fields populated by a separate price-data integration, not by Claude
)

youtubers (
  id              uuid primary key,
  channel_name    text,
  youtube_channel_id text,
  subscriber_count bigint,
  avatar_color    text,            -- for UI avatar chip
  status          text             -- 'active' | 'pending_review' | 'rejected'
)

explainers (
  ticker          text primary key references stocks(ticker),
  what            text,
  why             text,
  backstory       text,
  related_tickers jsonb,           -- [{ticker, note}], see ExplainerSidebar cross-linking
  generated_at    timestamptz,
  model_version   text             -- track which Claude model/prompt version drafted it, for refresh logic
)

monthly_snapshots (
  id              uuid primary key,
  period          text,            -- 'YYYY-MM'
  ticker          text,
  total_mentions  int,
  net_conviction  int,             -- buy count - sell count for the period
  price_at_period_start numeric,
  price_at_freeze_time   numeric,  -- updated periodically post-freeze to power "X is up Y% since" highlights
  story_summary   text             -- short Claude-drafted summary of what happened that period
)
```

**Why this shape**: every derived view (today's consensus, this week's momentum, the leaderboard, "what was hot 6 months ago") is a query against `mentions`, not a separately-maintained table that can drift out of sync. `monthly_snapshots` is the one deliberate exception — a frozen, periodically-refreshed summary table specifically for the long-term "highlights" feature, computed once a month closes rather than recalculated live on every page view.

---

## Channel Sourcing & Vetting

### Quality bar for every channel (write this down, don't skip it)
- Makes **specific, ticker-level calls** ("buy NVDA") — not generic education content ("here's what diversification means"). Educational-only channels are out of scope even if well-regarded.
- Posts with enough frequency to feed a **daily** pipeline — near-daily or at minimum weekly. A channel posting twice a year is useless here regardless of subscriber count.
- Deliberately mix archetypes: value-investing style, momentum/options-trading style, growth/tech-focused style. The whole point of "consensus" breaks down if every tracked channel is the same flavor of opinion.
- Track record over raw popularity where assessable — a smaller, more consistently-reasoned channel is more valuable data than a high-subscriber hype channel.

### Vetting pipeline
1. `vet_channel.py` pulls a channel's last ~5 video titles/descriptions/transcripts
2. Claude scores: ticker-specificity, posting cadence signal, any visible red flags (undisclosed sponsorship language, "guaranteed returns" framing, pump-and-dump patterns)
3. Borderline/flagged results go to manual review — **never auto-approve a channel into the live pipeline without a human looking at the vetting output first**, especially early on
4. Approved channels get `status = 'active'` in the `youtubers` table and join the daily scan

### Submission flow
The `submit/page.tsx` form lets anyone (including channel creators themselves) suggest a channel. These always land in `status = 'pending_review'` — never auto-added. Per the prototype copy: "We don't pay for inclusion and inclusion isn't guaranteed."

---

## Key Interactions (ported from validated prototype — see `docs/product-spec.md` for full detail and rationale)

- **By-stock view**: searchable, sortable (momentum / mentions / conviction), each row shows a compact 30-day mention sparkline + consensus bar + momentum badge
- **Stock detail page**: full 30-day timeline, this-week-vs-last-week framing, full chronological mention history, ELI10 explainer trigger on the ticker name (dotted underline + info icon + one-time discovery tooltip)
- **ELI10 explainer sidebar**: slides in from the right, three sections (what it does / why in demand now / backstory) plus "where it fits in the stack" related-ticker cross-links that swap the sidebar content in place when clicked. Closes back to "see today's consensus" CTA.
- **Momentum calculation**: `heating` if this-week mention count > prior-week count (with a meaningful delta, not off-by-one noise); `cooling` if a previously-active stock has gone quiet; `steady` otherwise. This is the single most differentiating feature vs any competitor — surface it prominently.
- **Leaderboard**: week/month/year toggle, activity-score ranked (mentions × weight + unique stocks covered × weight), top 3 get medal styling. Explicitly labeled as not-yet-accuracy-based.
- **Watchlist**: bookmarkable from any stock row, expandable cards showing popularity/unique-channel-count/net-conviction/last-mentioned, sortable by popularity/momentum/conviction/A-Z.

---

## Roadmap (post-prototype)

- ~~Prototype UI validated~~ ✅ — by-stock, by-YouTuber, leaderboard, watchlist, ELI10 sidebar, disclaimer system, submit-channel form all designed and reviewed
- Next.js + Supabase skeleton, real `mentions` table live
- Port prototype components into real app, wired to live data
- First single-channel, single-video classification proof of concept
- Source + vet first 10 channels
- Daily batch pipeline running end-to-end for pilot channel set
- Manual accuracy spot-check on classification before scaling further (principle 5 — do not skip)
- Expand to 20-30 channels
- ELI10 explainer generation for all tracked tickers
- **Deferred, post-launch**: accuracy-based leaderboard ranking (needs months of price-after-call data first), monthly snapshot / historical highlights feature, monetization (freemium subscription), possible paid channel placement (must be disclosed, must not affect underlying data — see principle 6)

---

## Dev Notes

- This project is structurally modeled on the **Thinky** riddle app's data-sourcing pipeline (`scrape -> Claude classify -> filter -> merge`, with resumable JSON checkpoints) — same author, same proven pattern, different domain.
- Cost projections (see `docs/cost-projections.md`): roughly $5-30/month at pilot scale (10-30 channels), staying under ~$60-100/month even at 100+ channels, because Claude Haiku batch pricing and free-tier YouTube/Supabase quotas cover this comfortably. The cost curve that actually matters is per-user features later, not channel-scraping volume.
- SEO strategy (see `docs/seo-strategy.md`): the homepage/domain name is not the primary organic traffic driver — individual, SSR'd, daily-fresh ticker pages (`/stock/nvda`, `/stock/oklo`) are. Prioritize making those pages fast, crawlable, and genuinely updated daily over any cleverness at the domain-root level.
- UI copy convention: "sell" stance is labeled **"Overpriced"** in the UI, not "Sell" — reads more like authentic YouTuber vocabulary, less like a formal trading signal.
