"""
draft_explainer.py

One-time, per-ticker ELI10 explainer generation. This is NOT part of the
daily ingestion pipeline — it runs once when a new ticker is first seen,
and the result is cached in the `explainers` table indefinitely (see
docs/data-model.md).

Uses a higher-quality model than the daily classification pass (consider
Sonnet over Haiku here) since:
  - Volume is low (once per ticker, not once per video)
  - Quality matters more — this is read-heavy, user-facing educational
    content, not a one-line classification

Usage as a module:
    from draft_explainer import draft_explainer
    explainer = draft_explainer("MU", "Micron Technology", related_context=[...])
"""

import json
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

EXPLAINER_PROMPT = """Write a plain-English explainer for {ticker} ({company_name}) for a retail investor who has never heard of this company before.

CRITICAL STYLE RULES:
- This must be readable in under 1 minute. Be concise. No filler, no padding, no "in today's fast-paced market" style intros.
- Write for someone with zero finance background — explain it the way you'd explain it to a smart 10-year-old, using a simple analogy if it helps.
- Do NOT pad this to seem more substantial than it needs to be. Short and clear beats long and impressive.
- This is purely descriptive/educational. Do NOT include any investment opinion, recommendation, or stance on whether the stock is a good buy.

Provide exactly three sections:
1. "what" — 1-3 sentences: what does this company actually do, in plain language (use an analogy if genuinely helpful)
2. "why" — 1-3 sentences: why is this company relevant or in-demand right now (the current catalyst/context, factually)
3. "backstory" — 1-2 sentences: a memorable piece of context (founding story, a pivot, an acquisition) that helps someone remember this company

Optionally, if genuinely relevant, include a "related" array of 1-3 OTHER stock tickers that meaningfully connect to this company within the same industry/value-chain (e.g. a supplier, a direct competitor, a company in the same technology stack) — each with a short note on the connection. Only include tickers where the connection is real and specific — omit this entirely if nothing genuinely fits, do not force a connection.

Respond with ONLY valid JSON, no markdown formatting, no code fences:
{{"what": "...", "why": "...", "backstory": "...", "related": [{{"ticker": "XXX", "note": "..."}}]}}

Company: {company_name} ({ticker})
{context}
"""


def draft_explainer(ticker: str, company_name: str, context: str = "") -> dict:
    """
    Generates a one-time ELI10 explainer for a ticker. Returns a dict matching
    the `explainers` table shape (see docs/data-model.md). Caller is responsible
    for persisting the result and setting model_version/generated_at.
    """
    prompt = EXPLAINER_PROMPT.format(
        ticker=ticker,
        company_name=company_name,
        context=f"\nAdditional context: {context}" if context else "",
    )

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )

    raw_text = response.content[0].text.strip()

    try:
        result = json.loads(raw_text)
        return result
    except json.JSONDecodeError:
        print(f"[draft_explainer] Failed to parse JSON for {ticker}: {raw_text[:200]}")
        return {}


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python draft_explainer.py <TICKER> <Company Name>")
        sys.exit(1)

    ticker = sys.argv[1]
    company_name = " ".join(sys.argv[2:])

    result = draft_explainer(ticker, company_name)
    print(json.dumps(result, indent=2))
