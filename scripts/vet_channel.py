"""
vet_channel.py

Given a candidate YouTube channel's recent videos, asks Claude to assess
whether it meets the quality bar defined in docs/channel-sourcing.md:
specific ticker-level calls, not just vague educational content, no
obvious red flags.

This produces a recommendation, NOT an auto-approval. Per CLAUDE.md
principle 5 and docs/channel-sourcing.md, channel approval should always
have a human review step, especially while the channel list is small.

Usage as a module:
    from vet_channel import vet_channel
    result = vet_channel(channel_name="...", recent_transcripts=[...])
"""

import json
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

VETTING_PROMPT = """You are evaluating whether a YouTube finance channel is a good fit for a stock-opinion aggregation product.

QUALITY BAR (see docs/channel-sourcing.md for full rationale):
1. Makes specific, ticker-level calls ("buy NVDA because...") — not just vague educational content ("diversify your portfolio")
2. Shows real reasoning, not just a bare verdict
3. No obvious red flags: no "guaranteed returns" language, no apparent undisclosed promotional/sponsorship patterns, no pump-and-dump signals

Based on the following recent video transcripts from this channel, assess fit.

Respond with ONLY valid JSON, no markdown formatting:
{{
  "recommendation": "approve" | "reject" | "needs_human_review",
  "ticker_specificity_score": <1-10>,
  "red_flags": ["..."],
  "summary": "<1-2 sentence summary of why>"
}}

Channel name: {channel_name}

Recent video transcripts (titles + excerpts):
{transcripts}
"""


def vet_channel(channel_name: str, recent_transcripts: list[dict]) -> dict:
    """
    recent_transcripts: list of {"title": str, "transcript_excerpt": str}
    Returns a vetting verdict dict. Always route to manual review unless
    recommendation is unambiguously "approve" with no red flags AND a high
    ticker_specificity_score — when in doubt, default to needs_human_review.
    """
    transcripts_text = "\n\n".join(
        f"Title: {t['title']}\nExcerpt: {t['transcript_excerpt'][:1500]}"
        for t in recent_transcripts
    )

    prompt = VETTING_PROMPT.format(
        channel_name=channel_name,
        transcripts=transcripts_text,
    )

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )

    raw_text = response.content[0].text.strip()

    try:
        result = json.loads(raw_text)
        # Safety net: never let the script itself auto-approve. The caller
        # (a human review step) makes the final call regardless of this output.
        return result
    except json.JSONDecodeError:
        print(f"[vet_channel] Failed to parse JSON: {raw_text[:200]}")
        return {
            "recommendation": "needs_human_review",
            "ticker_specificity_score": 0,
            "red_flags": ["classification_error"],
            "summary": "Could not parse model response, defaulting to manual review.",
        }
