'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Bookmark, ChevronRight } from 'lucide-react';
import MentionTimeline from '@/components/MentionTimeline';
import ConsensusBar from '@/components/ConsensusBar';
import MomentumBadge from '@/components/MomentumBadge';
import StanceChip from '@/components/StanceChip';
import YoutuberAvatar from '@/components/YoutuberAvatar';
import { YOUTUBERS_BY_ID } from '@/lib/mock-data';
import type { StockSummary } from '@/lib/types';

type SortKey = 'popularity' | 'momentum' | 'conviction' | 'alpha';
const MOMENTUM_ORDER = { heating: 0, steady: 1, cooling: 2 } as const;

interface Props {
  allSummaries: StockSummary[];
}

export default function WatchlistView({ allSummaries }: Props) {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(['NVDA', 'OKLO', 'MU', 'COHR']));
  const [sortBy, setSortBy] = useState<SortKey>('popularity');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['NVDA']));
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);

  const watchedSummaries = useMemo(
    () => allSummaries.filter(s => watchlist.has(s.ticker)),
    [allSummaries, watchlist]
  );

  // Derive sectors from the watched list only
  const sectors = useMemo(() => {
    const seen = new Set<string>();
    watchedSummaries.forEach(s => { if (s.sector) seen.add(s.sector); });
    return [...seen].sort();
  }, [watchedSummaries]);

  const filtered = useMemo(() => {
    let list = sectorFilter ? watchedSummaries.filter(s => s.sector === sectorFilter) : watchedSummaries;
    if (sortBy === 'popularity') return [...list].sort((a, b) => b.count_7d - a.count_7d);
    if (sortBy === 'momentum') return [...list].sort((a, b) => MOMENTUM_ORDER[a.momentum] - MOMENTUM_ORDER[b.momentum] || b.count_7d - a.count_7d);
    if (sortBy === 'conviction') return [...list].sort((a, b) => (b.buy_7d - b.sell_7d) - (a.buy_7d - a.sell_7d));
    return [...list].sort((a, b) => a.ticker.localeCompare(b.ticker));
  }, [watchedSummaries, sortBy, sectorFilter]);

  function toggleWatch(ticker: string) {
    setWatchlist(prev => { const n = new Set(prev); n.has(ticker) ? n.delete(ticker) : n.add(ticker); return n; });
  }
  function toggleExpand(ticker: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(ticker) ? n.delete(ticker) : n.add(ticker); return n; });
  }

  if (watchlist.size === 0) {
    return (
      <div className="text-center py-16 text-ink-muted">
        <Bookmark size={28} className="mx-auto mb-2.5 opacity-40" />
        <p className="text-[13.5px]">
          No stocks watched yet. Tap the bookmark icon on any stock to track its mention pattern here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls row */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-[11px] text-ink-faint uppercase tracking-widest">
          {watchlist.size} stock{watchlist.size === 1 ? '' : 's'} tracked
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-faint">Sort by</span>
          <div className="flex gap-0.5 bg-parchment-muted rounded-lg p-0.5">
            {([
              { id: 'popularity', label: 'Popularity' },
              { id: 'momentum', label: 'Momentum' },
              { id: 'conviction', label: 'Conviction' },
              { id: 'alpha', label: 'A–Z' },
            ] as { id: SortKey; label: string }[]).map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className="px-2.5 py-1.5 text-[12px] rounded-md font-medium transition-colors"
                style={{
                  background: sortBy === opt.id ? 'var(--color-parchment-card)' : 'transparent',
                  color: sortBy === opt.id ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sector filter chips — only shown when 2+ sectors present */}
      {sectors.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setSectorFilter(null)}
            className="px-2.5 py-1 text-[12px] rounded-full font-medium border transition-colors"
            style={{
              background: sectorFilter === null ? 'var(--color-ink)' : 'transparent',
              color: sectorFilter === null ? 'var(--color-parchment)' : 'var(--color-ink-muted)',
              borderColor: sectorFilter === null ? 'var(--color-ink)' : 'var(--color-ink-border)',
            }}
          >
            All sectors
          </button>
          {sectors.map(sector => (
            <button
              key={sector}
              onClick={() => setSectorFilter(prev => prev === sector ? null : sector)}
              className="px-2.5 py-1 text-[12px] rounded-full font-medium border transition-colors"
              style={{
                background: sectorFilter === sector ? 'var(--color-ink)' : 'transparent',
                color: sectorFilter === sector ? 'var(--color-parchment)' : 'var(--color-ink-muted)',
                borderColor: sectorFilter === sector ? 'var(--color-ink)' : 'var(--color-ink-border)',
              }}
            >
              {sector}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {filtered.map(s => {
          const isExpanded = expanded.has(s.ticker);
          const topYtCounts = s.mentions_7d.reduce<Record<string, number>>((acc, m) => {
            acc[m.youtuber_id] = (acc[m.youtuber_id] ?? 0) + 1;
            return acc;
          }, {});
          const mostActiveId = Object.keys(topYtCounts).sort((a, b) => topYtCounts[b] - topYtCounts[a])[0];

          return (
            <div key={s.ticker} className="bg-parchment-card border border-parchment-border rounded-xl overflow-hidden">
              {/* Row */}
              <button
                onClick={() => toggleExpand(s.ticker)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-parchment-hover transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="font-serif font-semibold text-[15px] text-ink">{s.ticker}</span>
                  <span className="text-[11px] text-ink-muted">{s.name}</span>
                  <span className="text-[11px] text-ink-muted bg-parchment-muted px-2 py-0.5 rounded">{s.sector}</span>
                  <MomentumBadge momentum={s.momentum} />
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-[12px] text-ink-muted">
                    <strong className="text-ink text-[14px]">{s.count_7d}</strong> mentions / wk
                  </div>
                  <div className="w-[100px]">
                    <MentionTimeline histogram={s.histogram} compact />
                  </div>
                  <div className="w-32">
                    <ConsensusBar buy={s.buy_7d} hold={s.hold_7d} sell={s.sell_7d} />
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleWatch(s.ticker); }}
                    className="p-0.5 text-heating"
                  >
                    <Bookmark size={15} fill="var(--color-heating)" />
                  </button>
                  <ChevronRight
                    size={16}
                    className="text-ink-border transition-transform"
                    style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                  />
                </div>
              </button>

              {/* Expanded */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-parchment-muted">
                  <div className="grid grid-cols-4 gap-2.5 mt-4 mb-4">
                    <div className="bg-parchment-deep rounded-lg p-3">
                      <div className="text-[11px] text-ink-muted mb-0.5">Popularity (7d)</div>
                      <div className="font-serif text-[15px] font-semibold text-ink">{s.count_7d} mentions</div>
                      <div className="text-[11px]" style={{ color: s.count_7d >= s.count_prev7d ? 'var(--color-buy)' : 'var(--color-sell)' }}>
                        {s.count_7d >= s.count_prev7d ? '+' : ''}{s.count_7d - s.count_prev7d} vs prior week
                      </div>
                    </div>
                    <div className="bg-parchment-deep rounded-lg p-3">
                      <div className="text-[11px] text-ink-muted mb-0.5">Unique channels</div>
                      <div className="font-serif text-[15px] font-semibold text-ink">{s.unique_youtubers_7d} of 6</div>
                      <div className="text-[11px] text-ink-muted">covering it this week</div>
                    </div>
                    <div className="bg-parchment-deep rounded-lg p-3">
                      <div className="text-[11px] text-ink-muted mb-0.5">Net conviction</div>
                      <div
                        className="font-serif text-[15px] font-semibold"
                        style={{ color: s.buy_7d - s.sell_7d >= 0 ? '#3F7D58' : '#B04A3F' }}
                      >
                        {s.buy_7d - s.sell_7d >= 0 ? '+' : ''}{s.buy_7d - s.sell_7d}
                      </div>
                      <div className="text-[11px] text-ink-muted">{s.buy_7d} buy − {s.sell_7d} caution</div>
                    </div>
                    <div className="bg-parchment-deep rounded-lg p-3">
                      <div className="text-[11px] text-ink-muted mb-0.5">Last mentioned</div>
                      <div className="font-serif text-[15px] font-semibold text-ink">
                        {s.days_since_last_mention === 0 ? 'Today' : `${s.days_since_last_mention}d ago`}
                      </div>
                      {mostActiveId && (
                        <div className="text-[11px] text-ink-muted truncate">
                          most active: {YOUTUBERS_BY_ID[mostActiveId]?.channel_name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] uppercase tracking-widest text-ink-muted mb-2">Recent calls</div>
                  <div className="flex flex-col gap-1.5">
                    {[...s.mentions_all].reverse().slice(0, 3).map(m => {
                      const yt = YOUTUBERS_BY_ID[m.youtuber_id];
                      if (!yt) return null;
                      const days = Math.round((new Date('2026-06-20').getTime() - new Date(m.mentioned_at).getTime()) / 86400000);
                      return (
                        <div key={m.id} className="flex gap-2.5 items-start p-2 bg-input-bg border border-parchment-muted rounded-lg">
                          <YoutuberAvatar initials={yt.avatar_initials} color={yt.avatar_color} avatarUrl={yt.avatar_url} size={26} />
                          <div className="flex-1 min-w-0">
                            <div className="flex gap-2 items-center mb-0.5">
                              <span className="text-[13.5px] font-medium text-ink">{yt.channel_name}</span>
                              <span className="text-[11px] text-ink-faint">{days === 0 ? 'today' : `${days}d ago`}</span>
                              <div className="ml-auto"><StanceChip stance={m.stance} size="sm" /></div>
                            </div>
                            <p className="text-[13.5px] text-ink-mid leading-relaxed">{m.reasoning}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    href={`/stock/${s.ticker.toLowerCase()}`}
                    className="mt-3 text-[13px] text-ink font-medium flex items-center gap-1 no-underline hover:underline"
                  >
                    View full history <ChevronRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && sectorFilter && (
          <div className="text-center py-8 text-ink-muted text-[13.5px]">
            No watched stocks in <strong>{sectorFilter}</strong>.{' '}
            <button onClick={() => setSectorFilter(null)} className="text-ink underline">Show all</button>
          </div>
        )}
      </div>
    </div>
  );
}
