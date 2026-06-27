-- ============================================================
-- 001_initial_schema.sql
-- Run once in Supabase SQL editor to create all tables.
-- ============================================================

-- ── Stocks ───────────────────────────────────────────────────
create table if not exists stocks (
  ticker          text primary key,
  name            text not null,
  sector          text,
  price           numeric,           -- updated daily by update_prices.py
  change          numeric,           -- % change today, updated daily
  earnings_date   date,              -- optional, for earnings badge in UI
  created_at      timestamptz default now()
);

-- ── YouTubers ─────────────────────────────────────────────────
create table if not exists youtubers (
  id                  uuid primary key default gen_random_uuid(),
  channel_name        text not null,
  youtube_channel_id  text unique not null,  -- e.g. "@marketmoolah" or "UCxxx"
  subscriber_count    bigint,
  avatar_color        text,                  -- hex colour for UI avatar chip
  avatar_initials     text,                  -- e.g. "MTA" shown in avatar
  archetype           text,                  -- e.g. "value-investor", "momentum-trader"
  status              text not null default 'pending_review'
                        check (status in ('active', 'pending_review', 'rejected')),
  added_at            timestamptz default now()
);

-- ── Mentions ──────────────────────────────────────────────────
create table if not exists mentions (
  id              uuid primary key default gen_random_uuid(),
  stock_ticker    text not null references stocks(ticker),
  youtuber_id     uuid not null references youtubers(id),
  video_id        text not null,
  video_url       text not null,
  video_timestamp_seconds int,               -- for deep-link to exact moment
  mentioned_at    timestamptz not null,      -- video publish date, NOT scrape date
  stance          text not null check (stance in ('buy', 'hold', 'sell')),
  reasoning       text not null,
  price_at_call   numeric,                   -- stock price when mention was classified
  is_first_tracked_mention boolean default false,
  created_at      timestamptz default now(),
  unique (stock_ticker, youtuber_id, video_id)
);

create index if not exists idx_mentions_stock_date    on mentions (stock_ticker, mentioned_at desc);
create index if not exists idx_mentions_youtuber_date on mentions (youtuber_id,  mentioned_at desc);
create index if not exists idx_mentions_date          on mentions (mentioned_at desc);

-- ── Explainers ────────────────────────────────────────────────
create table if not exists explainers (
  ticker          text primary key references stocks(ticker),
  what            text not null,
  why             text not null,
  backstory       text not null,
  related_tickers jsonb default '[]',   -- [{"ticker":"COHR","note":"..."}]
  generated_at    timestamptz default now(),
  model_version   text
);

-- ── Monthly snapshots ─────────────────────────────────────────
create table if not exists monthly_snapshots (
  id                    uuid primary key default gen_random_uuid(),
  period                text not null,      -- 'YYYY-MM'
  ticker                text not null references stocks(ticker),
  total_mentions        int not null,
  net_conviction        int not null,       -- buy_count - sell_count
  price_at_period_start numeric,
  price_at_last_refresh numeric,
  story_summary         text,
  frozen_at             timestamptz default now(),
  last_refreshed_at     timestamptz,
  unique (period, ticker)
);

-- ── Channel submissions (from submit form) ────────────────────
create table if not exists channel_submissions (
  id            uuid primary key default gen_random_uuid(),
  channel_name  text not null,
  youtube_url   text not null,
  reason        text,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  submitted_at  timestamptz default now()
);

-- ── Row-level security ────────────────────────────────────────
-- Public read on stocks, mentions, youtubers, explainers (the frontend needs these).
-- Everything else is service-role only.

alter table stocks              enable row level security;
alter table youtubers           enable row level security;
alter table mentions            enable row level security;
alter table explainers          enable row level security;
alter table monthly_snapshots   enable row level security;
alter table channel_submissions enable row level security;

-- Public read policies
create policy "public can read stocks"
  on stocks for select using (true);

create policy "public can read active youtubers"
  on youtubers for select using (status = 'active');

create policy "public can read mentions"
  on mentions for select using (true);

create policy "public can read explainers"
  on explainers for select using (true);

-- Anyone can submit a channel (insert only, no read back)
create policy "public can submit channels"
  on channel_submissions for insert with check (true);
