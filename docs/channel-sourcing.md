# Channel Sourcing & Vetting

## Quality bar (do not skip channels past this filter)

A channel qualifies for the daily pipeline only if it:

1. **Makes specific, ticker-level calls.** "I'm bullish on NVDA into earnings" qualifies. "Diversification is important for long-term investors" does not, no matter how good the channel otherwise is. Pure-education channels are out of scope for this product (they don't generate `mentions` rows).
2. **Posts frequently enough to feed a daily pipeline.** Near-daily or weekly minimum. A channel posting twice a year contributes nothing to a momentum/freshness-based product, regardless of subscriber count.
3. **Represents a distinct archetype.** Deliberately source a mix: value-investing style, momentum/options/swing-trading style, growth-and-tech-focused style. If every tracked channel is the same flavor of opinion, "consensus" stops meaning anything — it's just one worldview echoed 20 times.
4. **Shows reasoning, not just a verdict.** A channel that says "buy NVDA, trust me" is lower value than one that says "buy NVDA because data center backlog extends into 2027" — the reasoning is what populates `mentions.reasoning` and is most of the product's actual value to a reader.

Subscriber count is a weak signal on its own. A 90K-subscriber channel with a real track record of specific, reasoned calls is more valuable data than a 2M-subscriber channel of pure hype with no real conviction.

## Sourcing candidates

Don't rely on stale "best finance YouTubers" listicle articles — upload cadence changes fast and these lists go stale within months. Real sourcing approach:

1. Use the YouTube Data API `search.list` with finance-specific queries ("stocks to buy this week," "[ticker] stock analysis," "is [ticker] a buy") to surface active channels, not just well-known ones
2. Pull each candidate's recent upload history (`channels.list` + `playlistItems.list` on their uploads playlist) to confirm actual current cadence — don't trust a channel's "About" page or external articles
3. Run `scripts/vet_channel.py` against the last ~5 videos' transcripts: Claude scores ticker-specificity, flags vague/educational-only content, flags any visible red flags (undisclosed sponsorship language, "guaranteed returns" claims, pump-and-dump patterns)
4. Borderline or flagged results require manual human review before approval — **never auto-approve into the live pipeline**, especially while the channel list is small and each one matters more

## Submission flow (community-sourced channels)

The `submit/page.tsx` form allows anyone — including channel creators themselves — to suggest a channel. All submissions land in `channel_submissions` with `status = 'pending'`. Never auto-add. UI copy should make clear: no payment for inclusion, inclusion not guaranteed, prioritization goes to channels meeting the quality bar above.

## Red flags to watch for during vetting

- Vague stance language with no real conviction ("could go either way," repeated across most calls — low classification value)
- Undisclosed promotional language patterns (sounds like a paid placement without disclosure)
- "Guaranteed returns" or similarly absolute language — a real credibility red flag in finance content generally, not just for this product
- Extremely low view counts relative to subscriber count (may indicate a channel that bought subscribers, or one that's gone dormant despite still nominally posting)

## First-batch target

Start with 8-10 channels across the different archetypes above, prove the pipeline end-to-end (ingestion → classification → display) before scaling to the full 20-30 channel target. Accuracy validation (see CLAUDE.md principle 5) should happen at this pilot scale, not after scaling further.
