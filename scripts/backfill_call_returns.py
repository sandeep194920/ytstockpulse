"""
backfill_call_returns.py

Nightly job. For each mention where price_at_call was recorded but the
price_Xd_after columns are still NULL and enough time has passed, fetches
the historical close price via yfinance and updates the column.

This is what eventually unlocks the Track Record leaderboard tab and
per-stock credibility scoring. Run nightly via cron.

Usage:
    python scripts/backfill_call_returns.py
"""

import os
from datetime import date, timedelta
import yfinance as yf
from supabase import create_client, Client

supabase: Client = create_client(
    os.environ["NEXT_PUBLIC_SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

# How many days after the call we fill in each column
WINDOWS = [
    ("price_30d_after", 30),
    ("price_90d_after", 90),
    ("price_1y_after", 365),
]


def fetch_close_price(ticker: str, target_date: date) -> float | None:
    """Fetches the closing price on or near target_date using yfinance history.
    Tries exact date first, then looks 5 days forward (for weekends/holidays)."""
    try:
        end = target_date + timedelta(days=6)
        hist = yf.Ticker(ticker).history(start=str(target_date), end=str(end))
        if hist.empty:
            return None
        return float(hist["Close"].iloc[0])
    except Exception as e:
        print(f"[backfill] Price history fetch failed for {ticker} on {target_date}: {e}")
        return None


def run_backfill():
    today = date.today()
    total_updated = 0

    for column, days in WINDOWS:
        # Find mentions where price_at_call is set, enough time has passed,
        # but this window hasn't been filled yet.
        cutoff = str(today - timedelta(days=days))
        rows = (
            supabase.table("mentions")
            .select("id, stock_ticker, mentioned_at")
            .not_.is_(column, "null")  # price_at_call must exist
            .is_(column, "null")       # this window not yet filled
            .lt("mentioned_at", cutoff)
            .execute()
        )

        # Correct the filter: need price_at_call not null
        rows = (
            supabase.table("mentions")
            .select("id, stock_ticker, mentioned_at")
            .not_.is_("price_at_call", "null")
            .is_(column, "null")
            .lt("mentioned_at", cutoff)
            .execute()
        )

        print(f"[backfill] {column}: {len(rows.data)} rows to fill")

        for row in rows.data:
            mention_date = date.fromisoformat(row["mentioned_at"][:10])
            target_date = mention_date + timedelta(days=days)
            price = fetch_close_price(row["stock_ticker"], target_date)

            if price is None:
                print(f"[backfill] No price found for {row['stock_ticker']} on {target_date}, skipping")
                continue

            supabase.table("mentions").update({column: price}).eq("id", row["id"]).execute()
            total_updated += 1
            print(f"[backfill] Updated {row['id']}: {row['stock_ticker']} {column}={price}")

    print(f"[backfill] Done. {total_updated} columns updated.")


if __name__ == "__main__":
    run_backfill()
