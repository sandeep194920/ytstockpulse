# Data Model

## Design principle

One append-only log table (`mentions`) is the source of truth. Every other view in the product — today's consensus, this week's momentum, the leaderboard, historical highlights — is a derived query or periodic snapshot against that log. Do not build a parallel "daily summary" table as a primary store; it will drift out of sync with the raw log.

## Schema

```sql
create table stocks (
  ticker          text primary key,
  name            text not null,
  sector          text,
  created_at      timestamptz default now()
);

create table youtubers (
  id                  uuid primary key default gen_random_uuid(),
  channel_name        text not null,
  youtube_channel_id  text unique not null,
  subscriber_count    bigint,
  avatar_color        text,         -- hex, for UI avatar chip
  status              text not null default 'pending_review'
                        check (status in ('active', 'pending_review', 'rejected')),
  added_at            timestamptz default now()
);

create table mentions (
  id              uuid primary key default gen_random_uuid(),
  stock_ticker    text not null references stocks(ticker),
  youtuber_id     uuid not null references youtubers(id),
  video_id        text not null,     -- YouTube video ID, dedup key alongside stock_ticker
  video_url       text not null,
  mentioned_at    timestamptz not null,  -- video PUBLISH date, not scrape/ingestion date
  stance          text not null check (stance in ('buy', 'hold', 'sell')),
  reasoning       text not null,      -- Claude-extracted summary, short, NEVER a verbatim transcript quote
  created_at      timestamptz default now(),
  unique (stock_ticker, youtuber_id, video_id)  -- prevent duplicate ingestion of same call
);

create index idx_mentions_stock_date on mentions (stock_ticker, mentioned_at desc);
create index idx_mentions_youtuber_date on mentions (youtuber_id, mentioned_at desc);

create table explainers (
  ticker            text primary key references stocks(ticker),
  what              text not null,
  why               text not null,
  backstory         text not null,
  related_tickers   jsonb default '[]',  -- [{ "ticker": "COHR", "note": "..." }]
  generated_at      timestamptz default now(),
  model_version     text                  -- e.g. "claude-sonnet-4-6", for refresh/audit tracking
);

create table monthly_snapshots (
  id                      uuid primary key default gen_random_uuid(),
  period                  text not null,   -- 'YYYY-MM'
  ticker                  text not null references stocks(ticker),
  total_mentions          int not null,
  net_conviction          int not null,    -- buy_count - sell_count for the period
  price_at_period_start   numeric,
  price_at_last_refresh   numeric,         -- updated periodically to power "up X% since" highlights
  story_summary           text,            -- short Claude-drafted recap
  frozen_at               timestamptz default now(),
  last_refreshed_at       timestamptz,
  unique (period, ticker)
);

create table channel_submissions (
  id              uuid primary key default gen_random_uuid(),
  channel_name    text not null,
  youtube_url     text not null,
  reason          text,
  status          text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  submitted_at    timestamptz default now()
);
```

## Derived views (computed, not stored as primary data)

### Daily / weekly consensus per stock
```sql
select stance, count(*) 
from mentions 
where stock_ticker = $1 and mentioned_at >= now() - interval '7 days'
group by stance;
```

### Momentum (heating / cooling / steady)
Compute `last7_count` and `prev7_count` per stock (mentions in days 0-6 vs days 7-13), compare per the logic in `lib/momentum.ts` / `docs/product-spec.md`. Cheap enough to compute on read for current scale; consider a nightly materialized view once mention volume grows large.

### Leaderboard (activity-based, v1)
```sql
select youtuber_id, count(*) as mention_count, count(distinct stock_ticker) as stocks_covered
from mentions
where mentioned_at >= now() - interval '7 days'  -- or 30 / 365 for month/year toggle
group by youtuber_id
order by (count(*) * 10 + count(distinct stock_ticker) * 4) desc;
```

## Why `explainers` and `monthly_snapshots` are separate tables, not views

Both are intentionally **materialized, not computed live**:
- `explainers`: Claude-generation is a real API cost; this should happen once per ticker (on first sighting) and be cached indefinitely (with a `model_version` field to support manual or periodic regeneration if the business changes meaningfully — e.g. an acquisition, a pivot).
- `monthly_snapshots`: deliberately frozen once a period closes, then periodically refreshed for current price only. This is what eventually powers a "track record" / historical highlights feature without expensive live aggregation across years of raw mention data.

## Open questions for implementation (flag for product decision, don't guess silently)

- Price data source for `stocks.price`/`change` and `monthly_snapshots.price_at_*` — needs a market data API (not in scope of this doc, pick one with a free/cheap tier: e.g. a standard equities quote API)
- Whether `mentions.reasoning` needs any copyright-safety review pass (it should already be a short paraphrase per the classification prompt, never a transcript excerpt — enforce this in the `classify_mentions.py` prompt design, not just convention)
