'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Info, X, Play, AlertTriangle, Flag } from 'lucide-react';
import MentionTimeline from '@/components/MentionTimeline';
import MomentumBadge from '@/components/MomentumBadge';
import StanceChip from '@/components/StanceChip';
import YoutuberAvatar from '@/components/YoutuberAvatar';
import ConsensusBar from '@/components/ConsensusBar';
import ExplainerSidebar from '@/components/ExplainerSidebar';
import { MENTIONS, STOCKS_BY_TICKER } from '@/lib/mock-data';
import { buildTimestampUrl, formatTimestamp, priceSinceCall } from '@/lib/youtube';
import { archetypeFromSlug, archetypeColor } from '@/lib/archetypes';
import type { StockSummary, Youtuber, ExplainerContent } from '@/lib/types';

interface Props {
  summary: StockSummary;
  youtubers: Youtuber[];
  explainer: ExplainerContent | null;
}

function formatEarningsDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date('2026-06-23T00:00:00');
  const daysOut = Math.round((d.getTime() - today.getTime()) / 86400000);
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (daysOut <= 3) return `Earnings ${label} — this week`;
  if (daysOut <= 14) return `Earnings ${label} — ${daysOut}d away`;
  return `Earnings ${label}`;
}

export default function StockDetailView({ summary: s, youtubers, explainer }: Props) {
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const hasExplainer = !!explainer;
  const youtubersById = Object.fromEntries(youtubers.map(y => [y.id, y]));

  const mentionsNewestFirst = [...s.mentions_all].reverse();
  const isPositive = (s.change ?? 0) >= 0;

  // "Also covered by" — other channels covering this ticker that aren't already showing today
  const channelsCoveringTicker = Array.from(new Set(s.mentions_all.map(m => m.youtuber_id)));

  // Companion stocks — other tickers that share at least 2 of the same channels as this ticker
  const companionMap: Record<string, Set<string>> = {};
  for (const m of MENTIONS) {
    if (m.stock_ticker === s.ticker) continue;
    if (!channelsCoveringTicker.includes(m.youtuber_id)) continue;
    if (!companionMap[m.stock_ticker]) companionMap[m.stock_ticker] = new Set();
    companionMap[m.stock_ticker].add(m.youtuber_id);
  }
  const companionStocks = Object.entries(companionMap)
    .filter(([, channels]) => channels.size >= 2)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 4)
    .map(([ticker, channels]) => ({ ticker, sharedChannelCount: channels.size, stock: STOCKS_BY_TICKER[ticker] }))
    .filter(c => !!c.stock);

  return (
    <div>
      <Link href="/" className="text-ink-faint text-[12px] mb-4 inline-block no-underline hover:text-ink-muted">
        ← back to all stocks
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start mb-1.5">
        <div>
          <div className="flex items-baseline gap-2.5 relative">
            {hasExplainer ? (
              <button
                onClick={() => setExplainerOpen(true)}
                className="flex items-baseline gap-1.5 bg-none border-none cursor-pointer p-0 font-mono"
              >
                <span
                  className="font-serif font-semibold text-[32px] text-ink leading-tight"
                  style={{ borderBottom: '2px dotted var(--color-ink-border)' }}
                >
                  {s.ticker}
                </span>
                <Info size={16} className="text-ink-faint mb-1" />
              </button>
            ) : (
              <span className="font-serif font-semibold text-[32px] text-ink leading-tight">{s.ticker}</span>
            )}
            <span className="text-[14px] text-ink-muted">{s.name}</span>

            {/* One-time discovery hint */}
            {hasExplainer && !hintDismissed && (
              <div
                className="absolute top-[calc(100%+10px)] left-0 z-20 bg-ink text-parchment text-[12.5px] px-3 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap shadow-lg"
                style={{ animation: 'fadeIn .3s ease' }}
              >
                <span>👆 Tap the ticker to see what this company actually does</span>
                <button
                  onClick={() => setHintDismissed(true)}
                  className="text-ink-faint hover:text-parchment p-0 border-none bg-none cursor-pointer"
                >
                  <X size={13} />
                </button>
                <div className="absolute -top-1 left-6 w-2.5 h-2.5 bg-ink rotate-45" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="text-[11px] text-ink-faint bg-parchment-muted px-2 py-0.5 rounded">{s.sector}</span>
            <MomentumBadge momentum={s.momentum} />
            {s.earnings_date && (
              <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-warn-bg text-warn border border-warn-border">
                📅 {formatEarningsDate(s.earnings_date)}
              </span>
            )}
          </div>
        </div>

        {s.price != null && (
          <div className="text-right">
            <div className="font-serif text-[26px] font-semibold">${s.price.toLocaleString()}</div>
            <div className="text-[12px]" style={{ color: isPositive ? 'var(--color-buy)' : 'var(--color-sell)' }}>
              {isPositive ? '+' : ''}{s.change}% today
            </div>
          </div>
        )}
      </div>

      {/* Consensus warnings */}
      {s.consensus_trap && (
        <div className="flex items-start gap-2.5 bg-warn-bg border border-warn-border rounded-xl px-3.5 py-3 mb-4 text-[13px] text-warn">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" />
          <span>
            <strong>Unanimous buy consensus</strong> — all tracked channels agree this week. See the calls below and draw your own conclusions.
          </span>
        </div>
      )}
      {s.consensus_split && !s.consensus_trap && (
        <div className="flex items-start gap-2.5 bg-warn-bg border border-warn-border rounded-xl px-3.5 py-3 mb-4 text-[13px] text-warn">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" />
          <span>
            <strong>Split verdict this week</strong> — channels that typically agree are disagreeing.
            This usually means new information is in play. Read all calls before drawing conclusions.
          </span>
        </div>
      )}

      {/* 30-day timeline */}
      <div className="bg-parchment-card border border-parchment-border rounded-xl p-4.5 my-5">
        <div className="flex justify-between items-baseline mb-3">
          <span className="text-[11px] uppercase tracking-widest text-ink-faint">30-day mention pattern</span>
          <span className="text-[12px] text-ink-muted">
            <strong className="text-ink">{s.count_7d}</strong> this week vs{' '}
            <strong className="text-ink">{s.count_prev7d}</strong> the week before
          </span>
        </div>
        <MentionTimeline histogram={s.histogram} />
        <div className="flex justify-between text-[11px] text-ink-faint mt-1.5">
          <span>30 days ago</span>
          <span>today</span>
        </div>
        {s.momentum === 'heating' && (
          <p className="text-[13px] text-heating mt-3 leading-relaxed">
            🔥 {s.unique_youtubers_7d} different channels picked this up in the last 7 days — more activity than the prior week. Worth checking what changed.
          </p>
        )}
        {s.momentum === 'cooling' && (
          <p className="text-[13px] text-cooling mt-3 leading-relaxed">
            ❄️ Last mentioned {s.days_since_last_mention} days ago — was more active two weeks ago. Coverage has quieted down.
          </p>
        )}
      </div>

      {/* Stance summary cards + consensus bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-buy-bg rounded-xl p-3.5 text-center">
          <div className="font-serif text-[24px] font-semibold text-buy">{s.buy_7d}</div>
          <div className="text-[12px] text-buy">say BUY (7d)</div>
        </div>
        <div className="bg-hold-bg rounded-xl p-3.5 text-center">
          <div className="font-serif text-[24px] font-semibold text-hold">{s.hold_7d}</div>
          <div className="text-[12px] text-hold">say HOLD (7d)</div>
        </div>
        <div className="bg-sell-bg rounded-xl p-3.5 text-center">
          <div className="font-serif text-[24px] font-semibold text-sell">{s.sell_7d}</div>
          <div className="text-[12px] text-sell">say OVERPRICED (7d)</div>
        </div>
      </div>
      <div className="mb-6">
        <ConsensusBar buy={s.buy_7d} hold={s.hold_7d} sell={s.sell_7d} showTrapWarning={s.consensus_trap} />
      </div>

      {/* Mention history */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[11px] uppercase tracking-widest text-ink-faint">Full mention history, most recent first</span>
        <span className="text-[11px] text-ink-faint italic">— opinions, not advice</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {mentionsNewestFirst.map(m => {
          const yt = youtubersById[m.youtuber_id];
          if (!yt) return null;
          const days = Math.round((new Date('2026-06-20').getTime() - new Date(m.mentioned_at).getTime()) / 86400000);
          const archetype = archetypeFromSlug(yt.archetype);
          const timestampUrl = buildTimestampUrl(m.video_url, m.video_timestamp_seconds);
          return (
            <div key={m.id} className="flex gap-3 p-3.5 bg-parchment-card border border-parchment-border rounded-xl">
              <YoutuberAvatar initials={yt.avatar_initials} color={yt.avatar_color} avatarUrl={yt.avatar_url} size={36} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/youtubers/${yt.id}`}
                      className="font-medium text-[13.5px] text-ink no-underline hover:underline"
                    >
                      {yt.channel_name}
                    </Link>
                    {archetype && (
                      <span
                        className="text-[10.5px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: archetypeColor(archetype) + '1A', color: archetypeColor(archetype) }}
                      >
                        {archetype}
                      </span>
                    )}
                    {m.is_first_tracked_mention && (
                      <span className="flex items-center gap-0.5 text-[10.5px] text-ink-faint bg-parchment-muted px-1.5 py-0.5 rounded">
                        <Flag size={9} />
                        First here
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-ink-faint">{days === 0 ? 'today' : `${days}d ago`}</span>
                    {m.video_timestamp_seconds != null ? (
                      <a
                        href={timestampUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink no-underline"
                        title="Jump to this moment in the video"
                      >
                        <Play size={10} />
                        {formatTimestamp(m.video_timestamp_seconds)}
                      </a>
                    ) : (
                      <a
                        href={m.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink no-underline"
                        title="Watch video"
                      >
                        <Play size={10} />
                        Watch
                      </a>
                    )}
                    <StanceChip stance={m.stance} />
                  </div>
                </div>
                <p className="text-[13.5px] text-ink-mid leading-relaxed">{m.reasoning}</p>
                {m.price_at_call != null && (() => {
                  const pct = priceSinceCall(m.price_at_call, s.price);
                  if (pct === null) return null;
                  const up = pct >= 0;
                  const currentPrice = s.price?.toLocaleString();
                  return (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px]">
                      <span
                        className="font-medium px-1.5 py-0.5 rounded"
                        style={{
                          background: up ? 'var(--color-buy-bg)' : 'var(--color-sell-bg)',
                          color: up ? 'var(--color-buy)' : 'var(--color-sell)',
                        }}
                      >
                        {up ? '▲' : '▼'} {up ? '+' : ''}{pct}% since this call
                      </span>
                      <span className="text-ink-faint">
                        (${m.price_at_call.toLocaleString()} → ${currentPrice})
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Also covered by these channels */}
      {companionStocks.length > 0 && (
        <div className="mt-8">
          <div className="text-[11px] uppercase tracking-widest text-ink-faint mb-2.5">
            Channels covering {s.ticker} also talk about
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {companionStocks.map(({ ticker, sharedChannelCount, stock }) => (
              <Link
                key={ticker}
                href={`/stock/${ticker.toLowerCase()}`}
                className="bg-parchment-card border border-parchment-border rounded-xl px-3.5 py-3 flex items-center justify-between no-underline hover:bg-parchment-hover transition-colors"
              >
                <div>
                  <div className="font-serif font-semibold text-[14px] text-ink">{ticker}</div>
                  <div className="text-[12px] text-ink-muted mt-0.5">{stock.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-ink-faint">{sharedChannelCount} shared channel{sharedChannelCount > 1 ? 's' : ''}</div>
                  <div className="text-[10.5px] text-ink-faint mt-0.5 bg-parchment-muted px-1.5 py-0.5 rounded">{stock.sector}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {explainerOpen && explainer && (
        <ExplainerSidebar
          initialTicker={s.ticker}
          initialExplainer={explainer}
          onClose={() => setExplainerOpen(false)}
        />
      )}
    </div>
  );
}
