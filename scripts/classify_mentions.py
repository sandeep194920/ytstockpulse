"""
classify_mentions.py

The core extraction step: given a video transcript, ask Claude to identify
every specific stock ticker mentioned, the stance taken, and a short
(non-verbatim, copyright-safe) summary of the reasoning.

Uses Haiku for cost — this runs once per video, potentially hundreds of
times a day at scale, so cost-per-call matters here in a way it doesn't
for the one-time-per-ticker explainer drafting (see draft_explainer.py,
which can afford a higher-quality model since it runs far less often).

Usage as a module:
    from classify_mentions import classify_transcript
    results = classify_transcript(transcript_text, video_title="...")
    # -> [{"ticker": "NVDA", "stance": "buy", "reasoning": "..."}, ...]
"""

import json
import os
import requests
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
AV_KEY = os.environ.get("MARKET_DATA_API_KEY", "")

# Cache prices per process run — if 3 videos mention NVDA today, fetch once
_price_cache: dict[str, float | None] = {}


def get_price_at_call(ticker: str) -> float | None:
    """Fetch current price for a ticker from Alpha Vantage. Cached per run."""
    if ticker in _price_cache:
        return _price_cache[ticker]
    if not AV_KEY:
        return None
    try:
        r = requests.get(
            "https://www.alphavantage.co/query",
            params={"function": "GLOBAL_QUOTE", "symbol": ticker, "apikey": AV_KEY},
            timeout=10,
        )
        r.raise_for_status()
        price_str = r.json().get("Global Quote", {}).get("05. price")
        price = float(price_str) if price_str else None
    except Exception as e:
        print(f"[classify_mentions] Price fetch failed for {ticker}: {e}")
        price = None
    _price_cache[ticker] = price
    return price

CLASSIFICATION_PROMPT = """You are analyzing a finance YouTube video transcript to extract specific stock mentions.

Your job: identify every US-listed stock ticker that the speaker gives a clear, specific opinion on. 

RULES:
- Only include a ticker if the speaker takes a real, specific stance on it — not just a passing mention.
- "stance" must be exactly one of: "buy", "hold", "sell" (use "sell" for negative/overpriced/bearish framing, "hold" for neutral/wait-and-see, "buy" for positive/bullish framing).
- "reasoning" must be a SHORT paraphrase in your own words (1-2 sentences, under 30 words) — NEVER a direct quote or close paraphrase of the transcript's exact wording. This is a copyright requirement, not a style preference.
- Skip vague educational content with no specific ticker opinion (e.g. general "diversify your portfolio" advice) — return an empty list if there's nothing to extract.
- Skip if the speaker is ambiguous or contradicts themselves with no resolved stance — only extract clear, resolved opinions.
- Do not invent tickers or reasoning not actually present in the transcript.

Respond with ONLY a JSON array, no other text, no markdown formatting, no code fences:
[{{"ticker": "NVDA", "stance": "buy", "reasoning": "..."}}, ...]

If no qualifying mentions exist, respond with exactly: []

Video title: {video_title}

Transcript:
{transcript}
"""


def classify_transcript(transcript: str, video_title: str = "") -> list[dict]:
    """
    Sends a transcript to Claude for structured stock-mention extraction.
    Returns a list of {ticker, stance, reasoning} dicts. Empty list if
    nothing qualifies or on parse failure (logged, not raised, so a single
    bad response doesn't kill a batch run).
    """
    prompt = CLASSIFICATION_PROMPT.format(
        video_title=video_title or "(untitled)",
        transcript=transcript[:20000],  # guard against extremely long transcripts
    )

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw_text = response.content[0].text.strip()
    # Strip markdown fences if model wraps output despite instructions
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()

    try:
        results = json.loads(raw_text)
        if not isinstance(results, list):
            print(f"[classify_mentions] Unexpected response shape: {raw_text[:200]}")
            return []
        # Attach price_at_call to each result — a failed fetch returns None,
        # which is fine. A missing price never blocks a mention from being stored.
        for item in results:
            item["price_at_call"] = get_price_at_call(item["ticker"])
        return results
    except json.JSONDecodeError:
        print(f"[classify_mentions] Failed to parse JSON: {raw_text[:200]}")
        return []


if __name__ == "__main__":
    import sys
    from extract_transcript import get_transcript

    if len(sys.argv) != 2:
        print("Usage: python classify_mentions.py <video_id>")
        sys.exit(1)

    video_id = sys.argv[1]
    transcript = get_transcript(video_id)

    if not transcript:
        print("No transcript available, nothing to classify.")
        sys.exit(0)

    results = classify_transcript(transcript)
    print(json.dumps(results, indent=2))
