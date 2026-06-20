# SEO Strategy

## The core conclusion: the domain name is not the SEO asset. The ticker pages are.

Google de-emphasized exact-match-domain ranking signals over a decade ago. `ytstockpulse.com` won't outrank anyone on keyword-match alone. The actual organic traffic driver for this product is **individual, server-rendered, genuinely-updated-daily stock pages**: `/stock/nvda`, `/stock/oklo`, `/stock/mu`, etc.

## Why ticker pages specifically

People search "NVDA stock," "[ticker] stock youtube," "[ticker] buy or sell" constantly, at real volume, with clear intent. A page that:
- Is server-side rendered (fast first paint, fully crawlable — this is why Next.js App Router was chosen over a client-only SPA)
- Updates daily with genuinely new content (Google rewards freshness signals, especially for finance/news-adjacent queries)
- Has real structured data (mention counts, consensus breakdown, momentum) rather than thin/templated content
- Earns natural backlinks (a featured YouTuber linking back to their page is a strong, relevant backlink)

...is a strong long-term organic asset, compounding over time as more historical data accumulates per ticker.

## What this means for build priorities

- `app/stock/[ticker]/page.tsx` should be SSR (or static + revalidate, given daily-not-realtime update cadence) — not a client-rendered fetch that leaves search engines seeing an empty shell
- Page titles/meta descriptions should be dynamically generated per ticker: e.g. "NVDA — Today's YouTuber Consensus | ytstockpulse" with the actual buy/hold/sell counts in the meta description where possible
- Don't gate any of this content behind login/paywall — gated content doesn't get indexed/crawled the same way, and this would also violate the core "never gate the answer" product principle
- Internal linking matters: the ELI10 sidebar's "related stocks in the stack" cross-links double as internal SEO linking between ticker pages, which helps search engines understand topical relationships between pages

## What NOT to over-invest in

- Domain-level keyword stuffing, exact-match domain chasing, or similar legacy-SEO tactics — low payoff at this point in Google's algorithm history
- Heavy content-marketing/blog investment before the core product (ticker pages with real daily data) is solid — the data freshness IS the content strategy here, not a separate blog vertical
