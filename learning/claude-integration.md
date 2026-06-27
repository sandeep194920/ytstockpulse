# Claude AI Integration

> How we use Claude in ytstockpulse — which models, which tasks, why, and what the prompts look like.

---

## The Two Jobs Claude Does

| Job | Script | Model | Frequency | Why this model |
|-----|--------|-------|-----------|----------------|
| Stock mention classification | `classify_mentions.py` | Haiku 4.5 | Once per video (hundreds/day at scale) | Cheapest, fast, accurate enough for structured extraction |
| ELI10 explainer generation | `draft_explainer.py` | Sonnet 4.6 | Once per ticker (rare) | Higher quality, longer output, runs infrequently so cost doesn't matter |

---

## Job 1 — Stock Mention Classification

**The task:** Given a finance YouTube video transcript, extract every stock the speaker gives a clear, specific opinion on.

**The output:**
```json
[
  { "ticker": "NVDA", "stance": "buy", "reasoning": "Sees data center demand extending well into 2027 driven by AI infrastructure buildout." },
  { "ticker": "INTC", "stance": "sell", "reasoning": "Believes Intel is losing market share to AMD and TSMC with no clear recovery path." }
]
```

**Why structured JSON output?**
The pipeline needs to parse the response and insert rows into Supabase. Free-form text would require additional parsing logic and introduce failure points. We tell Claude to respond with ONLY a JSON array — no markdown, no explanation.

**The rules we enforce in the prompt:**
1. Only extract if the speaker takes a *real, specific stance* — not a passing mention
2. `stance` must be exactly `"buy"`, `"hold"`, or `"sell"` — no other values
3. `reasoning` must be a SHORT paraphrase (under 30 words) in Claude's own words — never a direct quote. This is a copyright requirement, not a style preference.
4. Skip vague educational content — return `[]` if nothing qualifies
5. Skip contradictory or unresolved opinions

**What "buy/hold/sell" maps to in the UI:**
- `"buy"` → shown as **Buy** (green)
- `"hold"` → shown as **Hold** (yellow)
- `"sell"` → shown as **Overpriced** (red) — the UI uses "Overpriced" because it matches how YouTubers actually talk, and avoids sounding like a formal trading signal

**Handling model drift / bad output:**
Sometimes Claude wraps its JSON in markdown code fences despite the instructions. The code strips these defensively:
```python
if raw_text.startswith("```"):
    raw_text = raw_text.split("```")[1]
    if raw_text.startswith("json"):
        raw_text = raw_text[4:]
```
A `JSONDecodeError` is caught, logged, and returns `[]` — a single bad response never crashes the whole batch run.

**Transcript truncation:**
Transcripts are capped at 20,000 characters before sending. Most of the useful content in a finance video is in the first 60% anyway, and this keeps cost predictable.

---

## Job 2 — ELI10 Explainer Generation

**The task:** For any ticker appearing in `mentions` for the first time, generate a short, neutral, stable explainer about the company.

**"ELI10"** = "Explain Like I'm 10" — accessible plain English, no jargon, suitable for someone who's never heard of the company.

**What gets generated:**

| Field | What it answers |
|-------|-----------------|
| `what` | What does this company actually do? |
| `why` | Why is it being talked about by finance YouTubers right now? |
| `backstory` | How did it get to where it is today? |
| `related_tickers` | Other stocks in the same space — for sidebar cross-linking |

**Example output for NVDA:**
```json
{
  "what": "NVIDIA designs chips (GPUs) that were originally built for video games but turned out to be perfect for training AI models...",
  "why": "Every major AI lab is buying NVIDIA chips as fast as they can be made. Demand for its H100 and B200 chips is outpacing supply...",
  "backstory": "Founded in 1993, NVIDIA spent its first decade focused on gaming. The 2010s shift to general-purpose GPU computing (CUDA) accidentally positioned it to dominate AI...",
  "related_tickers": [
    { "ticker": "AMD", "note": "Main GPU competitor, gaining ground in AI with MI300X" },
    { "ticker": "TSM", "note": "TSMC manufactures NVIDIA chips" }
  ]
}
```

**Why cache this, not generate it live?**
Claude API calls cost money and take ~2-3 seconds. There's no reason to regenerate "what does NVDA do" on every page view — the company's business model doesn't change week to week. We generate once, store in the `explainers` table, and serve from DB forever (until manually refreshed).

**The `model_version` field:**
Every explainer row stores which Claude model and (ideally) prompt version generated it:
```
model_version: "claude-sonnet-4-6"
```
This lets us identify and regenerate old explainers if we upgrade the prompt or switch models. Without this, you'd have no way to know which rows are stale.

**When to regenerate:**
- Company goes through a major pivot, merger, or acquisition
- Prompt is significantly improved
- We switch to a better model

---

## Cost Reference

At pilot scale (13 channels, ~10 videos/channel/week):

| Job | Cost per call | Calls/month | Monthly cost |
|-----|--------------|-------------|--------------|
| Classification (Haiku) | ~$0.0003 | ~520 | ~$0.15 |
| Explainer (Sonnet) | ~$0.01 | ~20 new tickers | ~$0.20 |
| **Total** | | | **~$0.35/month** |

At 30 channels posting daily (~900 videos/month), classification stays under $5/month. The ELI10 cost is a one-time sunk cost per ticker — once 500 tickers have explainers, new ones come in slowly.

---

## The `lib/claude.ts` Wrapper

The frontend uses `lib/claude.ts` for any Claude calls made server-side (e.g. if we later add on-demand ELI10 generation via an API route). The Python scripts import `anthropic` directly.

Key pattern in the wrapper: model selection is centralised there — so switching models for a feature means changing one line, not hunting across files.
