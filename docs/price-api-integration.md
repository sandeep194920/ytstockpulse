# Price API Integration — Alpha Vantage

## What we use it for

Two things, only two:

1. **`price_at_call`** — the stock price at the exact moment Claude classifies a mention. Written once per mention row, never updated. This is what powers "▲ +7.8% since this call."
2. **Daily price snapshot** — end-of-day price + % change for every tracked ticker. Updates `stocks.price` and `stocks.change` once per day. Powers the homepage price column.

We do NOT need real-time prices. End-of-day is enough for both use cases.

---

## Setup

### 1. Get a free API key

Go to https://www.alphavantage.co/support/#api-key, enter your email. Key arrives instantly. No credit card.

Free tier limits:
- 25 requests / day
- 5 requests / minute

### 2. Add to `.env.local`

```
MARKET_DATA_API_KEY=your_key_here
```

Also add to your Vercel environment variables (Settings → Environment Variables) when you deploy.

---

## API endpoints we use

### Single quote (used during classification to capture `price_at_call`)

```
GET https://www.alphavantage.co/query
  ?function=GLOBAL_QUOTE
  &symbol=NVDA
  &apikey=YOUR_KEY
```

Response:
```json
{
  "Global Quote": {
    "01. symbol": "NVDA",
    "05. price": "1303.45",
    "09. change": "26.91",
    "10. change percent": "2.1082%"
  }
}
```

Parse: `response["Global Quote"]["05. price"]` → store as `price_at_call`

### Daily update (loop GLOBAL_QUOTE per ticker)

`BATCH_STOCK_QUOTES` was deprecated by Alpha Vantage. The daily cron loops through tickers one at a time using `GLOBAL_QUOTE`, sleeping 13 seconds between calls to respect the 5 req/min rate limit.

At 25 tickers: 25 requests, ~5 minutes total runtime. Fits exactly within the free tier's 25 req/day limit.

---

## Request budget (free tier = 25/day)

| Job | Requests | When |
|---|---|---|
| Daily price snapshot | 1 per tracked ticker | 6pm ET daily |
| `price_at_call` per new video | 1 per unique ticker per run | During classification |

Example at 15 tickers + 8 new videos mentioning 5 unique tickers: 15 + 5 = 20 requests. Safe.
At 25 tickers + many videos: hits the 25/day ceiling — upgrade to $50/month plan, or skip `price_at_call` fetching on busy days (it's nullable, never blocks a mention).

---

## Script: `scripts/update_prices.py`

Runs once daily after market close (6pm ET). Fetches closing prices for all `active` tickers in Supabase and writes them back.

```python
import os
import requests
from supabase import create_client

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
AV_KEY       = os.environ["MARKET_DATA_API_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_batch_prices(tickers: list[str]) -> dict[str, dict]:
    """Returns {ticker: {price, change_pct}} for up to 100 tickers in one request."""
    symbols = ",".join(tickers)
    r = requests.get(
        "https://www.alphavantage.co/query",
        params={"function": "BATCH_STOCK_QUOTES", "symbols": symbols, "apikey": AV_KEY},
        timeout=15,
    )
    r.raise_for_status()
    data = r.json().get("Stock Quotes", [])
    result = {}
    for q in data:
        ticker = q["1. symbol"]
        price  = float(q["2. price"])
        # Batch endpoint doesn't return % change directly — compute from prior close
        # For simplicity, store price only; change% comes from GLOBAL_QUOTE if needed
        result[ticker] = {"price": price}
    return result

def run():
    # Fetch all tickers that have active mentions in the last 30 days
    rows = supabase.table("stocks").select("ticker").execute().data
    tickers = [r["ticker"] for r in rows]

    if not tickers:
        print("No tickers to update.")
        return

    prices = fetch_batch_prices(tickers)

    for ticker, data in prices.items():
        supabase.table("stocks").update({
            "price": data["price"],
            "updated_at": "now()",
        }).eq("ticker", ticker).execute()
        print(f"Updated {ticker}: ${data['price']}")

if __name__ == "__main__":
    run()
```

Run manually: `python scripts/update_prices.py`

Schedule via cron (on your server or GitHub Actions):
```
0 23 * * 1-5  # 6pm ET = 23:00 UTC, weekdays only
```

---

## In `classify_mentions.py` — capturing `price_at_call`

At classification time, fetch the price once per ticker per run (not once per mention — if 3 videos mention NVDA today, fetch NVDA once and reuse):

```python
_price_cache: dict[str, float] = {}

def get_price_at_call(ticker: str) -> float | None:
    """Fetch current price for a ticker. Cached per process run."""
    if ticker in _price_cache:
        return _price_cache[ticker]
    try:
        r = requests.get(
            "https://www.alphavantage.co/query",
            params={"function": "GLOBAL_QUOTE", "symbol": ticker, "apikey": AV_KEY},
            timeout=10,
        )
        r.raise_for_status()
        price_str = r.json().get("Global Quote", {}).get("05. price")
        if not price_str:
            return None
        price = float(price_str)
        _price_cache[ticker] = price
        return price
    except Exception as e:
        print(f"Price fetch failed for {ticker}: {e}")
        return None
```

Then when writing a mention row:
```python
mention_row = {
    "stock_ticker": ticker,
    "youtuber_id":  youtuber_id,
    "video_id":     video_id,
    "stance":       stance,
    "reasoning":    reasoning,
    "mentioned_at": published_at,
    "price_at_call": get_price_at_call(ticker),  # None if fetch fails — that's fine
}
```

`price_at_call` is nullable — a failed price fetch should never block a mention from being stored.

---

## Error handling rules

- **Rate limit hit (429)**: sleep 60s, retry once. If it fails again, skip and log — never crash the pipeline over a missing price.
- **Market closed / weekend**: Alpha Vantage returns the last trading day's close. That's fine — store it as-is.
- **Unknown ticker**: API returns `{}` or `{"Global Quote": {}}`. Return `None`, store `price_at_call = null`.
- **Network timeout**: catch, return `None`, continue.

Price data is always best-effort. The mention itself is the important thing.

---

## Testing without burning requests

Alpha Vantage returns demo data for `IBM` with the demo key:

```bash
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=demo"
```

Use `symbol=IBM&apikey=demo` in local dev to verify parsing without touching your quota.

---

## When to upgrade from free tier

Upgrade to $50/month (75 req/min, unlimited daily) when:
- You're processing 25+ new videos per day consistently, OR
- You add more than ~20 tickers to tracking

At 30 channels posting daily that's roughly 30 videos/day — right at the boundary. The $50/month plan is the natural next step and still negligible cost relative to Claude API spend.
