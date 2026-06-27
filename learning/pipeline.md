# The Data Pipeline — How YouTube Jobs Run

> This doc covers the full journey from a YouTube channel to a row in the database.
> Read this to understand what the scripts do, what they capture, and why each step exists.

---

## Overview

```
[youtubers table — active channels]
        ↓
fetch_new_videos.py       — "what did each channel upload recently?"
        ↓
extract_transcript.py     — "get the full spoken text of each video"
        ↓
classify_mentions.py      — "what stocks did they mention, and what did they say?"
        ↓
merge_mentions.py         — "write the results to Supabase"
        ↓
[mentions table]
```

There's also one separate job that runs independently:
```
draft_explainer.py        — "generate the ELI10 explainer for a newly-seen ticker"
```

---

## Step 1 — fetch_new_videos.py

**What it does:** Queries the YouTube Data API for each active channel's recent uploads. Returns a list of video IDs + metadata.

**How to run:**
```bash
# Backfill from a specific date (first-time setup or catch-up)
python scripts/fetch_new_videos.py --since 2026-05-01

# Daily mode — last 24 hours (for the cron job)
python scripts/fetch_new_videos.py
```

**What it fetches per video:**
- `video_id` — the YouTube video ID (e.g. `dQw4w9WgXcQ`)
- `video_url` — full YouTube watch URL
- `title` — video title (passed to Claude for context)
- `published_at` — publish date (stored as `mentioned_at` in DB)

**Key implementation detail — @handles vs UC... IDs:**
The YouTube API's `channels.list` endpoint only accepts `UC...` channel IDs, not `@handles`. The seed data in `002_seed_channels.sql` uses `@handles` (e.g. `@TomNashTV`) because they're human-readable and easy to verify. The script resolves these to `UC...` IDs automatically via `resolve_channel_id()` before making API calls.

**Resumable checkpointing:**
Progress is saved to `scripts/fetch_progress.json`. If the script crashes or gets interrupted mid-run, re-running it picks up where it left off — already-processed video IDs are skipped. This is safe to re-run at any time.

**YouTube quota:** Each channel lookup costs ~200 YouTube API units. With 10,000 units/day free and 13 channels, a daily run uses ~2,600 units — well within the free tier.

---

## Step 2 — extract_transcript.py

**What it does:** Pulls the caption/transcript for a given video ID using the `youtube-transcript-api` library.

**Usage as a module:**
```python
from extract_transcript import get_transcript
text = get_transcript("dQw4w9WgXcQ")
# Returns: full transcript as one string, or None if unavailable
```

**What it returns:**
- All caption segments joined into one continuous text string
- `None` if the video has no captions, captions are disabled, or YouTube blocks the request

**Why transcripts can fail:**
1. Video has no captions (creator didn't enable them)
2. YouTube rate-limits transcript requests from a single IP after too many rapid requests — add a `time.sleep(2)` between requests to avoid this
3. Some videos are members-only or private — transcript unavailable

**What we do on failure:** Log a warning and skip the video. The video ID is still checkpointed as "processed" so we don't retry indefinitely. A missing transcript doesn't block the rest of the batch.

**Copyright note:** We only use the transcript temporarily to pass to Claude for extraction. We never store the raw transcript text in the database.

---

## Step 3 — classify_mentions.py

**What it does:** Sends the transcript to Claude and gets back a structured list of stock mentions.

**Usage as a module:**
```python
from classify_mentions import classify_transcript
results = classify_transcript(transcript_text, video_title="NVDA Stock Analysis")
# Returns: [{"ticker": "NVDA", "stance": "buy", "reasoning": "..."}, ...]
```

**What Claude extracts per mention:**
| Field | Description |
|-------|-------------|
| `ticker` | US-listed stock ticker (e.g. `NVDA`, `AAPL`) |
| `stance` | Exactly one of: `"buy"`, `"hold"`, `"sell"` |
| `reasoning` | 1-2 sentence paraphrase in Claude's own words — NEVER a direct quote |

**What Claude skips:**
- Passing mentions with no clear stance ("NVDA was mentioned in the news")
- Vague educational content ("diversification is important")
- Contradictory or unresolved opinions
- Non-US stocks or indexes

**Model used:** `claude-haiku-4-5-20251001` — cheapest Claude model, sufficient for structured extraction. Cost is roughly $0.0002-0.001 per video depending on transcript length.

**Price capture:** If a `MARKET_DATA_API_KEY` is set (Alpha Vantage), the script also fetches the current stock price and attaches it as `price_at_call`. This is cached per run — if 3 videos mention NVDA today, the price is fetched once. A failed price fetch returns `None` and never blocks a mention from being stored.

**Transcript truncation:** Very long transcripts are truncated to 20,000 characters before sending to Claude. Finance videos rarely need more than this — most quality content is in the first 60% anyway.

---

## Step 4 — merge_mentions.py

**What it does:** Takes the classified results and writes them to Supabase.

**Usage as a module:**
```python
from merge_mentions import insert_mentions
insert_mentions(
    youtuber_id="uuid-from-supabase",
    video_id="dQw4w9WgXcQ",
    video_url="https://youtube.com/watch?v=dQw4w9WgXcQ",
    mentioned_at="2026-05-15T14:00:00Z",
    classified=[{"ticker": "NVDA", "stance": "buy", "reasoning": "..."}]
)
```

**Deduplication:** The `mentions` table has a unique constraint on `(stock_ticker, youtuber_id, video_id)`. Re-running the pipeline on the same video is safe — duplicate rows are silently skipped (not an error). This is intentional so backfills and daily runs can overlap without corrupting data.

**Auto-creates stocks:** If a ticker is seen for the first time, `ensure_stock_exists()` creates a minimal row in the `stocks` table (just the ticker as both `ticker` and `name`). A log message flags it: `"New ticker seen: OKLO — flag for explainer generation"`. The stock name, sector, and ELI10 explainer get filled in by separate jobs.

---

## The ELI10 Explainer — draft_explainer.py

**What it does:** For any new ticker that appears in `mentions`, generates a short "ELI10" explainer — what the company does, why it's in demand, and its backstory. This powers the sidebar that slides in when you click a ticker name on the site.

**This runs separately from the main pipeline** — it's a one-time job per ticker, not per video.

**How to run it for a specific ticker:**
```bash
python scripts/draft_explainer.py NVDA
```

**What Claude generates:**
| Field | Description |
|-------|-------------|
| `what` | What does this company actually do? (1-2 paragraphs, plain English) |
| `why` | Why is it being talked about right now? |
| `backstory` | How did it get to where it is? |
| `related_tickers` | Other stocks in the same space — for sidebar cross-linking |

**Model used:** `claude-sonnet-4-6` — a more capable model than Haiku, because this runs once per ticker (not hundreds of times a day) and quality matters more than cost here. The output is cached indefinitely in the `explainers` table.

**Why separate from classification?**
- Classification is dynamic — it changes daily as YouTubers post new opinions
- The explainer is stable — "what does NVDA do" doesn't change week to week
- Different quality bar — we can afford a better model for something that runs rarely

**`model_version` field:** Stored alongside each explainer so we know which Claude model/prompt generated it. If we later improve the prompt, we can query for old explainers and regenerate them.

---

## Running the Full Pipeline (end-to-end)

For the backfill (first time or catching up):
```bash
cd /path/to/ytstockpulse
source .env.local  # or use .venv and dotenv
.venv/bin/python scripts/fetch_new_videos.py --since 2026-05-01
```

For daily runs (set this up as a cron job):
```bash
.venv/bin/python scripts/fetch_new_videos.py
```

For generating explainers for newly-seen tickers:
```bash
# Find tickers in mentions that have no explainer yet
.venv/bin/python scripts/draft_explainer.py TICKER
```

---

## Common Issues & Fixes

**"Could not get uploads playlist for channel @handle"**
The YouTube API doesn't accept @handles in `channels.list`. The `resolve_channel_id()` function in `fetch_new_videos.py` handles this automatically — but if you add a channel directly via `UC...` ID it works without any resolution.

**"YouTube is blocking requests from your IP"**
The transcript API gets rate-limited after too many rapid requests. The fix is `time.sleep(2)` between transcript fetches (already in the code). If you're still getting blocked, the checkpoint lets you re-run safely — blocked videos will retry on the next run.

**"price_at_call is None for most tickers"**
Alpha Vantage free tier allows only 25 requests/day. In a large backfill, the quota runs out fast. This is fine — `price_at_call` is optional and a `None` value never blocks a mention row from being inserted. We can backfill prices separately later if needed.

**"Remote database is up to date" but tables don't exist**
This means migrations were already recorded in Supabase's migration history. Check the actual tables via Supabase dashboard → Table Editor. If tables exist, you're fine.
