"""
generate_all_explainers.py

One-time batch job: generates ELI10 explainers for every ticker in the
stocks table that doesn't already have one, and saves results to Supabase.

Usage:
    python scripts/generate_all_explainers.py

Safe to re-run — skips tickers that already have an explainer.
"""

import os
import time
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env.local")

from supabase import create_client
from draft_explainer import draft_explainer

supabase = create_client(
    os.environ["NEXT_PUBLIC_SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

# Known company names for our current tickers — avoids an extra API call
COMPANY_NAMES = {
    "AAPL":   "Apple Inc.",
    "AMD":    "Advanced Micro Devices",
    "AMZN":   "Amazon",
    "CRM":    "Salesforce",
    "F":      "Ford Motor Company",
    "GME":    "GameStop",
    "GOOGL":  "Alphabet (Google)",
    "GS":     "Goldman Sachs",
    "HIMS":   "Hims & Hers Health",
    "HOOD":   "Robinhood Markets",
    "JPM":    "JPMorgan Chase",
    "LCID":   "Lucid Group",
    "MCD":    "McDonald's",
    "MELI":   "MercadoLibre",
    "META":   "Meta Platforms",
    "MSFT":   "Microsoft",
    "MU":     "Micron Technology",
    "NFLX":   "Netflix",
    "NKE":    "Nike",
    "NVDA":   "NVIDIA",
    "PLTR":   "Palantir Technologies",
    "PYPL":   "PayPal",
    "SHOP":   "Shopify",
    "SOFI":   "SoFi Technologies",
    "SPACEX": None,  # Not publicly traded — skip
    "TSLA":   "Tesla",
}


def run():
    stocks = supabase.table("stocks").select("ticker").execute().data
    existing = supabase.table("explainers").select("ticker").execute().data
    existing_tickers = {e["ticker"] for e in existing}

    to_generate = [
        s["ticker"] for s in stocks
        if s["ticker"] not in existing_tickers and COMPANY_NAMES.get(s["ticker"]) is not None
    ]

    skipped = [s["ticker"] for s in stocks if COMPANY_NAMES.get(s["ticker"]) is None]
    already_done = [s["ticker"] for s in stocks if s["ticker"] in existing_tickers]

    print(f"Stocks in DB: {len(stocks)}")
    print(f"Already have explainer: {already_done}")
    print(f"Skipping (not public/unknown): {skipped}")
    print(f"Generating: {to_generate}\n")

    for i, ticker in enumerate(to_generate):
        company_name = COMPANY_NAMES[ticker]
        print(f"[{i+1}/{len(to_generate)}] Generating explainer for {ticker} ({company_name})...")

        result = draft_explainer(ticker, company_name)
        if not result:
            print(f"  ✗ Failed to generate for {ticker}, skipping.")
            continue

        row = {
            "ticker":          ticker,
            "what":            result.get("what", ""),
            "why":             result.get("why", ""),
            "backstory":       result.get("backstory", ""),
            "related_tickers": result.get("related", []),
            "model_version":   "claude-sonnet-4-6",
        }

        supabase.table("explainers").upsert(row, on_conflict="ticker").execute()

        # Also update the stock name if it's still just the ticker
        supabase.table("stocks").update({"name": company_name}).eq("ticker", ticker).eq("name", ticker).execute()

        print(f"  ✓ {ticker} — saved.")
        if i < len(to_generate) - 1:
            time.sleep(1)  # Small pause between Claude calls

    print(f"\nDone. Generated {len(to_generate)} explainer(s).")


if __name__ == "__main__":
    run()
