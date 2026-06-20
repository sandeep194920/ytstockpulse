# Product Spec — ytstockpulse

This document captures the full product reasoning from the planning phase, so Claude Code has the "why" behind every decision, not just the "what." Read this before making product decisions that aren't explicitly covered in CLAUDE.md.

---

## Origin story / core insight

The product idea came from a simple observation: finance YouTubers post stock opinions constantly, often overlapping. Watching 10+ videos a day to catch what's being said about a handful of stocks doesn't scale. The insight that makes this a *product* rather than just a scraper: **the pattern of mentions over time is itself a signal** — a stock that 5 channels suddenly start covering after 3 weeks of silence is meaningfully different from a stock that's been steadily mentioned every week. Most aggregators would only show "today's mentions." This product's edge is showing the *trend*.

## Explicit non-goals

- We are **not** trying to become "the next TipRanks" as a company-building goal. That requires years of runway, licensing relationships, and headcount this project doesn't have. The goal is a genuinely useful niche tool first; see what it grows into after real usage, not before.
- We are **not** giving our own stock opinions anywhere in the product. Every piece of stance/opinion content is attributed to a specific YouTuber. The ELI10 explainer is descriptive (what a company does), never prescriptive (whether to buy it).
- We are **not** building real-time/live data. Daily batch is the right cadence for this use case — the value is the daily digest, not minute-by-minute ticking data.

## The mention-log data model (why it's one table, not several)

Early design temptation: build separate tables for "today's view," "this week's view," "monthly summary." This is wrong. The correct model is a single append-only log of individual mentions (stock, youtuber, date, stance, reasoning), with every other view — daily, weekly, momentum, leaderboard — computed as a query or aggregation against that log. This was validated in the prototype's `mentionLog` array and `buildStockSummaries()` derivation function. Reasons this matters:

1. It can never drift out of sync — there's one source of truth
2. It's what makes the momentum feature (heating/cooling) possible at all — you need the actual dated history to compare "this week vs last week," not just a daily snapshot
3. It's what eventually powers the monthly snapshot / historical highlights feature without needing a separate parallel pipeline

## Momentum signal — the actual logic

For each stock, on each page load (or precomputed nightly):
- `last7` = mentions where `daysSince(date) <= 6`
- `prev7` = mentions where `6 < daysSince(date) <= 13`
- If `last7.length > prev7.length` (meaningfully, not by a single noisy mention) → **heating**
- If `last7.length == 0 and prev7.length > 0` → **cooling** (went from active to silent)
- If `last7.length < prev7.length` and `prev7.length > 0` → **cooling**
- Otherwise → **steady**

This was the single feature most explicitly called out as the product's actual differentiator versus "just another stock opinion aggregator." Don't lose this in the rebuild.

## ELI10 explainer sidebar — full rationale

**The problem it solves**: YouTubers narrate company explanations in long-form, conversational style, embedded inside a video discussing today's opinion. A viewer might understand "why this person likes NVDA today" without retaining "what NVDA actually does" — especially for less mainstream tickers (the example used repeatedly: most people can explain what Nvidia does, almost nobody can explain what Rocket Lab (RKLB) does, even after watching a video about it).

**Explicit design decisions**:
- Content is **drafted once by Claude per ticker**, cached, NOT pulled from any single video's framing — keeps it neutral and stable rather than tied to one YouTuber's spin or potential bias
- **Length: 1-minute read, not a Motley-Fool-style long article.** This was stated forcefully — the person explicitly said they dislike Motley Fool's pattern of padding explanations with filler before gating the actual answer behind a subscription. The explainer must never gate content.
- **Three-part structure**: what it does (plain English) / why it's in demand right now (ties to the catalyst) / backstory (one or two memorable sentences). Resist the urge to add more sections — brevity is the point.
- **Related stocks ("where it fits in the stack")**: when relevant (not mandatory for every ticker), show 1-3 related tickers with a short note on the connection — e.g., explaining Micron should be able to surface Coherent as "makes the optical components that may eventually connect memory to chips using light instead of copper." Clicking a related ticker swaps the sidebar content in place rather than closing and reopening, so a user can wander the dependency graph of the AI/tech stack without losing their place.
- **Discoverability without being annoying**: auto-opening the sidebar on every page load was explicitly rejected as too disruptive (it covers the primary content — the mention history — that the user came for). Instead: visible affordance (dotted underline + info icon on the ticker name) plus a one-time dismissible tooltip on first-ever visit, never shown again after dismissal or after the first click.

## Disclaimer system — three layers, not one

Explicitly requested as more than a single footer line, because real money decisions may follow from this product:

1. **First-visit blocking modal** — must be acknowledged before the dashboard is usable the first time
2. **Persistent banner** — thin strip under the nav, visible on every page, every time, not just once
3. **Inline marker at the point of decision** — e.g. "— opinions, not advice" directly next to the mention history label on stock detail pages, where someone is actually reading individual calls

## Leaderboard — why it's activity-based, not accuracy-based, in v1

The instinct to rank YouTubers by being "right" (their buy calls actually went up) is correct and is explicitly the intended long-term differentiator — but it requires weeks/months of price-after-call data to compute fairly, and shipping a flawed/premature accuracy score risks real reputational harm to a named creator (and real damage to product trust) before the data justifies it. v1 ranks by a transparent activity score (mention count + unique stocks covered) and the UI explicitly states why accuracy-based ranking isn't live yet. This is a deliberate sequencing decision, not a missing feature — don't accidentally ship a fake accuracy score under time pressure.

## Submit-a-channel flow

Turns tracked YouTubers from passive subjects into participants — creators can submit their own channel, which is both a trust-building gesture and a plausible organic growth channel (creators who get featured may promote it). Always lands in manual review (`pending_review` status), never auto-approved, with explicit UI copy that inclusion is not guaranteed and not paid for.

## Monetization — deliberately deferred, sequencing matters

Discussed options: freemium subscription (most realistic, matches TipRanks/Motley Fool precedent), affiliate/broker referral links (real money but risks feeling like ads in a trust-sensitive product — be careful), premium "alpha" tier (early-mention access, accuracy-weighted rankings), API/data licensing (long-term, not day-one), newsletter spin-off (low-effort addition once pipeline exists).

**Explicit sequencing decision**: do not monetize on day one. Get real organic usage first — people returning without being paid to is the actual validation signal. Layer in subscription once that's established.

**Paid channel placement** (a YouTuber paying for visibility) was raised and explicitly parked — not rejected, just deliberately not designed yet. If revisited later: must be visually disclosed as sponsored/promoted placement and must never alter the underlying mention/consensus data itself. The trust mechanic that makes the whole product work depends on this separation being airtight if it's ever introduced.

## Historical highlights feature (planned, not yet built)

The eventual goal: "PLTR was a top-consensus stock with strong conviction a year ago, and here's how it played out" — a track-record page that builds long-term trust and is genuinely difficult for a competitor to replicate without the same historical data.

**Design decision**: this is NOT computed live from the raw mention log on every page view (wasteful, and the raw log isn't optimized for "what was the story last June" queries). Instead, a periodic job (`freeze_monthly_snapshot.py`) runs once a month/quarter closes, computes the period's top stocks by net conviction, freezes mention totals, records the price at period start, and is periodically refreshed with current price to compute "up X% since." This produces a small, fast-to-read `monthly_snapshots` table that's the actual data source for any future highlights/track-record page.

This was explicitly noted as wanting analytics at **1 month, 3 month, 6 month, 1 year, and 5 year** windows eventually — added to the roadmap as a clear future milestone, not in scope for initial build.

## Domain & naming reasoning (for context, not action — domain is already chosen)

Went through several rounds: `ytstockreco` → rejected ("reco" implies recommendation, which conflicts with the explicit "not advice" positioning) → considered `ytstockpicks.com` (available, SEO-friendly, but "picks" carries the same advice-adjacent framing problem as "reco," just less obviously) → landed on **`ytstockpulse.com`**, chosen specifically because "pulse" frames the product as measurement/monitoring rather than as picking winners, which matches the actual product honestly. This was a deliberate trade of marginal SEO keyword-match (people search "stock picks" more literally than "stock pulse") for brand honesty and longer-term positioning, after concluding that real organic SEO traffic will come from per-ticker pages and content freshness, not from domain-level keyword matching (Google has de-emphasized exact-match-domain ranking signals for over a decade).

## Cost modeling (validated estimates, see docs/cost-projections.md for detail)

At pilot scale (10-30 channels, ~1 video/channel/day): Claude API (Haiku 4.5, batched) ≈ $5-30/month. YouTube Data API: $0 (free tier, especially using WebSub push instead of polling). Supabase: $0 (free tier) until real user accounts/auth justify the $25/month Pro tier. Even scaling to 100+ channels stays roughly $50-60/month. The cost driver that could meaningfully change this is per-user real-time AI features, which scale with users, not with channels scraped — a different problem to solve only once there are paying users to justify it.

## Reference: the Thinky pipeline this project's ingestion architecture is modeled on

A prior project by the same builder (a riddle-curation app) used exactly this pattern successfully: `scrape (YouTube Data API + transcript extraction) -> Claude (Haiku) structures candidates -> filter_candidates.py (quality filter) -> categorize -> merge into final dataset with auto-incremented IDs`, with resumable progress-tracking JSON files at each stage so reprocessing isn't required if a run is interrupted. ytstockpulse's `scripts/` pipeline should follow the same shape: `fetch_new_videos.py -> extract_transcript.py -> classify_mentions.py -> merge_mentions.py`, swapping "riddle extraction" for "stock mention extraction."
