# Data Model

> Why the database is shaped the way it is, and how every UI view derives from it.

---

## The Core Principle

**One append-only log table (`mentions`) is the source of truth.**

Every page in the app — today's consensus, the 30-day momentum chart, the leaderboard, a YouTuber's call history — is a derived query or computation against this one table. There is no separately-maintained "daily summary" table that could drift out of sync with the raw log.

---

## Tables

### `mentions` — the heart of everything

```sql
mentions (
  id                      uuid primary key,
  stock_ticker            text references stocks(ticker),
  youtuber_id             uuid references youtubers(id),
  video_id                text,            -- YouTube video ID
  video_url               text,
  mentioned_at            timestamptz,     -- video PUBLISH date, not scrape date
  stance                  text,            -- 'buy' | 'hold' | 'sell'
  reasoning               text,            -- short Claude paraphrase, never a verbatim quote
  price_at_call           numeric,         -- stock price at time of video (optional)
  video_timestamp_seconds int,             -- seconds into video (optional, for deep links)
  created_at              timestamptz,
  unique (stock_ticker, youtuber_id, video_id)
)
```

**Why `mentioned_at` = video publish date?**
Momentum and historical charts need to reflect *when the YouTuber actually said something*, not when our pipeline processed it. A May 15th video should appear on May 15th even if we process it weeks later during a backfill.

**Why the unique constraint on `(stock_ticker, youtuber_id, video_id)`?**
Idempotency. Re-running the pipeline on the same video (backfill overlap, retry after crash) silently skips duplicates rather than creating double-counted rows. This makes the pipeline safe to re-run at any time.

**Why `reasoning` is a paraphrase, never a quote?**
Copyright. The raw transcript is never stored — only a short, Claude-generated summary in its own words. The classification prompt explicitly enforces this.

---

### `stocks` — the ticker registry

```sql
stocks (
  ticker      text primary key,
  name        text,
  sector      text,
  price       numeric,     -- updated daily by update_prices.py
  change      numeric,     -- % change today
  created_at  timestamptz
)
```

Minimal rows are auto-created when a new ticker is first seen in `merge_mentions.py`. The name/sector/price fields get filled in by separate jobs. The pipeline never blocks on missing stock metadata.

---

### `youtubers` — the channel registry

```sql
youtubers (
  id                  uuid primary key,
  channel_name        text,
  youtube_channel_id  text unique,   -- @handle or UC... ID
  subscriber_count    bigint,
  avatar_color        text,          -- hex, for avatar chip in UI
  avatar_initials     text,          -- e.g. "TN" for Tom Nash
  avatar_url          text,          -- YouTube channel thumbnail URL (migration 003)
  archetype           text,          -- 'value-investor' | 'momentum-trader' | 'growth-investor' | 'dividend-investor'
  status              text           -- 'active' | 'pending_review' | 'rejected'
)
```

Only `status = 'active'` channels are fetched by the pipeline. Adding a channel manually sets `status = 'pending_review'` until a human reviews the vetting output and approves it.

---

### `explainers` — ELI10 sidebar content

```sql
explainers (
  ticker          text primary key references stocks(ticker),
  what            text,
  why             text,
  backstory       text,
  related_tickers jsonb,    -- [{ "ticker": "AMD", "note": "Main GPU competitor" }]
  generated_at    timestamptz,
  model_version   text      -- which Claude model generated it
)
```

Generated once per ticker by `draft_explainer.py`, cached indefinitely. The `model_version` field tracks which Claude model/prompt version generated each row — so we can identify and regenerate stale explainers when the prompt improves.

---

### `monthly_snapshots` — frozen historical highlights

```sql
monthly_snapshots (
  period                text,     -- 'YYYY-MM'
  ticker                text,
  total_mentions        int,
  net_conviction        int,      -- buy_count - sell_count for the period
  price_at_period_start numeric,
  price_at_last_refresh numeric,  -- updated periodically for "up X% since" highlights
  story_summary         text,     -- short Claude-drafted recap
  unique (period, ticker)
)
```

Computed once when a month closes (`freeze_monthly_snapshot.py`), then periodically refreshed for the current price only. This is the foundation for future "highlights" features like "NVDA was the most-mentioned stock in May, up 22% since then."

---

## How the UI Views Are Derived

### Today's consensus (home page)
```sql
select stance, count(*) 
from mentions 
where stock_ticker = $1 
  and mentioned_at >= now() - interval '7 days'
group by stance;
```

### 30-day mention timeline (stock detail page)
```sql
select date_trunc('day', mentioned_at) as day, count(*) as mentions
from mentions
where stock_ticker = $1
  and mentioned_at >= now() - interval '30 days'
group by day
order by day;
```

### Momentum (heating / cooling / steady)
Computed in `lib/momentum.ts`:
- `last7_count` = mentions in the last 7 days
- `prev7_count` = mentions in days 8-14
- If `last7 > prev7 + threshold` → **heating**
- If `last7 < prev7 - threshold` → **cooling**
- Otherwise → **steady**

### Leaderboard (activity-based score)
```sql
select youtuber_id, 
       count(*) as mention_count, 
       count(distinct stock_ticker) as stocks_covered,
       (count(*) * 10 + count(distinct stock_ticker) * 4) as activity_score
from mentions
where mentioned_at >= now() - interval '7 days'  -- or 30/365 for month/year toggle
group by youtuber_id
order by activity_score desc;
```

**Important:** This is activity-based, NOT accuracy-based. The leaderboard UI explicitly says so. An accuracy-based ranking needs months of price-after-call data first — it's on the roadmap but not built yet.

---

## Row Level Security (RLS)

All tables have RLS enabled. The frontend uses the publishable key which only has read access via these policies:

- `stocks` — public read
- `youtubers` — public read for `status = 'active'` only
- `mentions` — public read
- `explainers` — public read
- `channel_submissions` — public insert only (no read back)

The Python pipeline scripts use the `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS entirely. Never expose the service role key to the browser.

---

## Migrations

All schema changes live in `supabase/migrations/` as numbered SQL files:

```
001_initial_schema.sql   — all tables, indexes, RLS policies
002_seed_channels.sql    — first batch of vetted channels
003_add_avatar_url.sql   — added avatar_url column to youtubers
```

To apply migrations:
```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

To add a new migration — create the next numbered file and run `db push`. Never modify an already-applied migration file.
