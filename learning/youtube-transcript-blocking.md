# YouTube Transcript Blocking — What Happened & How We Fixed It

> Written after hitting YouTube rate limiting during the May 2026 backfill run.
> This doc covers what caused the block, every approach we tried, and the final working solution.

---

## What We Were Trying To Do

Run a backfill of 956 videos across 13 channels (May 1 – June 27, 2026) to seed the `mentions` table with historical data before launch.

---

## What Happened

The pipeline (`fetch_new_videos.py`) processes each video by:
1. Fetching the video list via YouTube Data API (fine — authenticated with API key)
2. Pulling the transcript via `youtube-transcript-api` (problem — unauthenticated HTTP requests)

After ~20 videos, YouTube started returning:

```
Could not retrieve a transcript for the video...
YouTube is blocking requests from your IP.
```

Every subsequent transcript request failed. The batch stalled at 20/956 videos.

---

## Why YouTube Blocks Transcript Requests

The `youtube-transcript-api` library makes raw HTTP requests to YouTube's caption endpoint — the same endpoint your browser hits when you enable captions. YouTube tracks the source IP and rate-limits it when it sees too many requests in a short time window.

This is a temporary IP block (resets after a few hours), not a permanent ban. But it completely stops a large batch run.

**Why Thinky never hit this:** Thinky uses the same library but only processes a handful of riddle videos at a time. Low volume = never triggers the threshold.

---

## Approaches We Tried

### Attempt 1 — Add a delay (2 seconds between requests)

Added `time.sleep(2)` between each transcript fetch in `fetch_new_videos.py`.

**Result:** Helped slightly but not enough. 956 videos × 2s = ~32 minutes of continuous requests to the same endpoint. Still triggered the block.

**Lesson:** The threshold isn't about speed — it's about total volume from one IP in a session.

### Attempt 2 — Switch to yt-dlp as backend

`yt-dlp` is a more sophisticated YouTube downloader that mimics real browser behaviour (rotates user agents, handles consent flows). The `youtube-transcript-api` library supports it as a backend.

**Result:** yt-dlp itself works, but our IP was already blocked from attempt 1. Even yt-dlp can't help when the IP is in a temporary ban state.

**Also discovered:** yt-dlp needs a JavaScript runtime to solve YouTube's "n challenge" for some videos — without it, some formats are unavailable. Not a transcript-specific issue but worth knowing.

### Attempt 3 — Browser cookies (final solution)

The real fix: pass YouTube session cookies so requests look like they come from a logged-in browser, not a bot.

**Why this works:**
- Requests with valid session cookies are treated as normal user browsing
- YouTube won't block an active logged-in session the same way it blocks anonymous bulk requests
- The cookies authenticate at the session level, not just the IP level

**Why we used a throwaway account (not the main Google account):**
- Worst case if YouTube flags the session: it logs out that account, not the main one
- No risk to the primary Google account or YouTube history

---

## The Final Setup

### What's installed
- `youtube-transcript-api` v1.2.4 (supports `http_client` parameter for custom sessions)
- `yt-dlp` v2026.6.9 (supports `cookiefile` option)

### Cookie file location
```
scripts/youtube-cookies.txt
```
Netscape cookie format, exported from Chrome using the "Get cookies.txt LOCALLY" extension while logged into a throwaway YouTube account.

**This file is gitignored** — never commit cookies to the repo.

### How to export fresh cookies (when they expire)

1. Open Chrome, sign into the throwaway YouTube account
2. Go to youtube.com
3. Click "Get cookies.txt LOCALLY" extension → Export
4. Save as `scripts/youtube-cookies.txt`

Cookies typically expire after 1-2 years but the session can be invalidated earlier if the account is logged out.

### How the code uses them

`extract_transcript.py` tries two methods in order:

1. **yt-dlp** with `cookiefile` — fetches subtitle/caption URLs directly, parses the JSON3 format
2. **youtube-transcript-api** with `http_client` — a `requests.Session` pre-loaded with the cookie jar as fallback

```python
# yt-dlp path
_ydl_opts = {
    "quiet": True,
    "skip_download": True,
    "cookiefile": str(COOKIES_FILE),  # cookies passed here
}

# youtube-transcript-api fallback path
jar = http.cookiejar.MozillaCookieJar(str(COOKIES_FILE))
jar.load(ignore_discard=True, ignore_expires=True)
session = requests.Session()
session.cookies = jar
api = YouTubeTranscriptApi(http_client=session)
```

---

## Important: IP Block Recovery

If you're seeing "YouTube is blocking requests from your IP" on every video:

**The cookies won't help until the IP block clears.** The IP block is a temporary ban (a few hours) that affects all requests from that IP regardless of authentication.

Wait 2-3 hours before retrying. The checkpoint file (`scripts/fetch_progress.json`) saves all already-processed video IDs, so re-running after the block lifts will skip those and continue from where it left off.

---

## Running the Backfill

```bash
# Clear the checkpoint if starting fresh
rm scripts/fetch_progress.json

# Run from project root
.venv/bin/python scripts/fetch_new_videos.py --since 2026-05-01
```

The script is resumable — safe to interrupt and re-run at any time.
