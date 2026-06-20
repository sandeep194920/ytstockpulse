# Cost Projections

## Pilot scale (10-30 channels, ~1 video/channel/day average)

| Service | Estimated cost | Notes |
|---|---|---|
| YouTube Data API | $0/month | Free tier = 10,000 quota units/day. Using WebSub push notifications for new uploads (free) instead of polling keeps this well within free tier even at 30 channels. |
| Transcript extraction | $0/month | `youtube-transcript-api`, no official cost, scrapes the public caption track. |
| Claude API (Haiku 4.5, batched) | $5-30/month | ~900 videos/month at ~6,000 input tokens / ~300 output tokens each ≈ $0.0075/video unbatched, ~$0.0035-0.004/video with 50% batch discount. Scale within this range as channel count/posting frequency varies. |
| Supabase | $0/month | Free tier comfortably covers a mention log of low tens-of-thousands of rows/year plus basic channel/explainer tables. |
| Hosting (Vercel) | $0/month | Free tier sufficient at launch traffic levels. |
| **Total** | **~$5-30/month** | |

## Scaled (100 channels, ~2 videos/channel/day average = ~6,000 videos/month)

| Service | Estimated cost | Notes |
|---|---|---|
| YouTube Data API | $0/month | Still within free tier using WebSub-first architecture. |
| Claude API (Haiku 4.5, batched) | ~$24/month | Linear scaling from pilot-scale math. |
| Supabase | ~$25/month | Likely need Pro tier at this volume for better limits/backups, especially once real user accounts exist. |
| Hosting | $0-20/month | Still likely free tier territory unless traffic is unusually high. |
| **Total** | **~$50-60/month** | Comfortably under $100/month even at this scale. |

## What would actually push costs past $100/month

Not channel-scraping volume — that scales cheaply and linearly. The real cost risk is **per-user, real-time AI features** (e.g. live personalized chat with the data, on-demand AI analysis per user request) — that scales with *user count* and *usage intensity*, a fundamentally different cost curve than the batch ingestion pipeline. Cross this bridge only once there's a paying user base to justify it; not a v1 concern.

## Sanity check on assumptions

These estimates assume:
- Daily batch processing, not real-time/live updates
- Haiku-tier model for classification (Sonnet-tier only for one-time, lower-volume tasks like ELI10 explainer drafting, where quality matters more than per-call cost and volume is much lower — one draft per ticker, not per video)
- Transcript-based classification (not requiring video/audio processing, which would be meaningfully more expensive)

Revisit this doc once real ingestion volume is running — these are pre-build estimates, not measured numbers.
