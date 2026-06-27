"""
update_prices.py

Daily cron job — run once after market close (6pm ET on weekdays).
Fetches closing price + day change% for every ticker in the stocks table
and writes them back.

Alpha Vantage free tier: 25 req/day, 5 req/min.
At 25 tickers this costs 25 requests — exactly the daily limit.
If you track more tickers, upgrade to the $50/month plan.

Usage:
    python scripts/update_prices.py

Schedule (cron, GitHub Actions, etc.):
    0 23 * * 1-5   # 23:00 UTC = 6pm ET, weekdays only
"""

import os
import time
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
AV_KEY       = os.environ["MARKET_DATA_API_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Alpha Vantage free tier: 5 requests/minute → wait 13s between calls to stay safe
REQUEST_DELAY_SECONDS = 13


def fetch_quote(ticker: str) -> dict | None:
    """Fetch price + change% for a single ticker."""
    try:
        r = requests.get(
            "https://www.alphavantage.co/query",
            params={"function": "GLOBAL_QUOTE", "symbol": ticker, "apikey": AV_KEY},
            timeout=15,
        )
        r.raise_for_status()
        gq = r.json().get("Global Quote", {})
        price_str  = gq.get("05. price")
        change_str = gq.get("10. change percent", "").replace("%", "")
        if not price_str:
            return None
        return {
            "price":  round(float(price_str), 2),
            "change": round(float(change_str), 2) if change_str else None,
        }
    except Exception as e:
        print(f"  [{ticker}] fetch failed: {e}")
        return None


def run():
    rows = supabase.table("stocks").select("ticker").execute().data
    if not rows:
        print("No tickers in stocks table — nothing to update.")
        return

    tickers = [r["ticker"] for r in rows]
    print(f"Updating prices for {len(tickers)} tickers (≈{len(tickers) * REQUEST_DELAY_SECONDS}s)...\n")

    updated = 0
    for i, ticker in enumerate(tickers):
        data = fetch_quote(ticker)
        if not data:
            print(f"  {ticker}: no data (market closed, unknown ticker, or rate limit)")
        else:
            supabase.table("stocks").update(data).eq("ticker", ticker).execute()
            change_str = f"{data['change']:+.2f}%" if data["change"] is not None else "n/a"
            print(f"  {ticker}: ${data['price']:,.2f}  {change_str}")
            updated += 1

        # Respect rate limit — skip delay after the last ticker
        if i < len(tickers) - 1:
            time.sleep(REQUEST_DELAY_SECONDS)

    print(f"\nDone — updated {updated}/{len(tickers)} tickers.")


if __name__ == "__main__":
    run()
