"""
merge_mentions.py

Inserts classified mention results into the Supabase `mentions` table.
Relies on the unique constraint (stock_ticker, youtuber_id, video_id) to
naturally dedupe re-runs — safe to re-process a video without creating
duplicate rows.

Usage as a module:
    from merge_mentions import insert_mentions
    insert_mentions(youtuber_id="...", video_id="...", video_url="...",
                     mentioned_at="2026-06-20T00:00:00Z", classified=[...])
"""

import os
from supabase import create_client, Client

supabase: Client = create_client(
    os.environ["NEXT_PUBLIC_SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],  # service role for write access from the pipeline
)


def ensure_stock_exists(ticker: str, name: str = None, sector: str = None):
    """Upserts a minimal stock row if it doesn't exist yet — explainers/price
    data get filled in by their own dedicated steps, not here."""
    existing = supabase.table("stocks").select("ticker").eq("ticker", ticker).execute()
    if not existing.data:
        supabase.table("stocks").insert({
            "ticker": ticker,
            "name": name or ticker,
            "sector": sector,
        }).execute()
        print(f"[merge_mentions] New ticker seen: {ticker} — flag for explainer generation")


def insert_mentions(
    youtuber_id: str,
    video_id: str,
    video_url: str,
    mentioned_at: str,
    classified: list[dict],
) -> int:
    """
    classified: output of classify_mentions.classify_transcript() or classify_with_timestamps()
    Returns count of rows successfully inserted (excludes duplicates skipped
    by the unique constraint).

    Each item may include:
      - ticker, stance, reasoning (required)
      - timestamp_seconds (optional int — from classify_with_timestamps)
    """
    inserted = 0
    for item in classified:
        ticker = item.get("ticker", "").upper().strip()
        stance = item.get("stance")
        reasoning = item.get("reasoning")

        if not ticker or stance not in ("buy", "hold", "sell") or not reasoning:
            print(f"[merge_mentions] Skipping malformed item: {item}")
            continue

        ensure_stock_exists(ticker)

        row = {
            "stock_ticker": ticker,
            "youtuber_id": youtuber_id,
            "video_id": video_id,
            "video_url": video_url,
            "mentioned_at": mentioned_at,
            "stance": stance,
            "reasoning": reasoning,
            "price_at_call": item.get("price_at_call"),  # set by classify_mentions via Alpha Vantage
            "video_timestamp_seconds": item.get("timestamp_seconds"),  # None if not extracted
        }

        try:
            supabase.table("mentions").insert(row).execute()
            inserted += 1
            print(f"[merge_mentions] Inserted: {ticker} / {stance} / price_at_call={item.get('price_at_call')}")
        except Exception as e:
            # Likely a duplicate (unique constraint violation) from a re-run —
            # this is expected and safe to skip, not a real error.
            print(f"[merge_mentions] Skipped (likely duplicate): {ticker} / {video_id} — {e}")

    return inserted
