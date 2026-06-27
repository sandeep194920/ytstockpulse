'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Flame, Bookmark, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import MentionTimeline from '@/components/MentionTimeline';
import ConsensusBar from '@/components/ConsensusBar';
import MomentumBadge from '@/components/MomentumBadge';
import type { StockSummary } from '@/lib/types';
import HowItWorks from '@/components/HowItWorks';

type SortKey = 'momentum' | 'mentions' | 'conviction';
const MOMENTUM_ORDER = { heating: 0, steady: 1, cooling: 2 } as const;

interface Props {
  summaries: StockSummary[];
}

export default function StocksView({ summaries }: Props) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('momentum');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(['NVDA', 'OKLO']));

  const heatingCount = summaries.filter(s => s.momentum === 'heating').length;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = summaries.filter(
      s => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
    if (sortBy === 'momentum') {
      list = list.sort((a, b) => MOMENTUM_ORDER[a.momentum] - MOMENTUM_ORDER[b.momentum] || b.count_7d - a.count_7d);
    } else if (sortBy === 'mentions') {
      list = list.sort((a, b) => b.count_7d - a.count_7d);
    } else {
      list = list.sort((a, b) => (b.buy_7d - b.sell_7d) - (a.buy_7d - a.sell_7d));
    }
    return list;
  }, [summaries, query, sortBy]);

  function toggleWatch(e: React.MouseEvent, ticker: string) {
    e.preventDefault();
    e.stopPropagation();
    setWatchlist(prev => {
      const next = new Set(prev);
      next.has(ticker) ? next.delete(ticker) : next.add(ticker);
      return next;
    });
  }

  return (
    <>
      <HowItWorks />

      <div className="flex gap-2.5 mb-4 items-center">
        <Search size={14} className="text-ink-muted shrink-0" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search ticker or company..."
          className="flex-1 px-3 py-2 border border-parchment-border rounded-lg bg-input-bg text-[13.5px] font-mono outline-none focus:border-ink-faint text-ink placeholder:text-ink-faint"
        />
        <div className="flex gap-0.5 bg-parchment-muted rounded-lg p-0.5">
          {(['momentum', 'mentions', 'conviction'] as SortKey[]).map(opt => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className="px-2.5 py-1.5 text-[12px] rounded-md font-medium capitalize transition-colors"
              style={{
                background: sortBy === opt ? 'var(--color-parchment-card)' : 'transparent',
                color: sortBy === opt ? 'var(--color-ink)' : 'var(--color-ink-muted)',
              }}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
        {heatingCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-heating font-medium px-2 py-1 bg-heating-bg rounded-md shrink-0">
            <Flame size={11} />
            {heatingCount} heating
          </span>
        )}
      </div>

      {/* Column headers */}
      <div className="text-[11px] text-ink-muted uppercase tracking-widest mb-2 flex justify-between items-center px-4">
        <span>Stock</span>
        <div className="flex items-center gap-7">
          <span className="w-[100px]">30-day pattern</span>
          <span className="w-20 text-right">This week</span>
          <span className="w-32">Consensus</span>
          <span className="w-[60px] text-right">Price</span>
          <span className="w-4" />
        </div>
      </div>

      <div className="flex flex-col gap-px bg-parchment-border rounded-xl overflow-hidden border border-parchment-border">
        {filtered.map(s => (
          <Link
            key={s.ticker}
            href={`/stock/${s.ticker.toLowerCase()}`}
            className="bg-parchment-card px-4 py-3.5 flex items-center justify-between no-underline hover:bg-parchment-hover transition-colors"
          >
            {/* Left: stock info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={e => toggleWatch(e, s.ticker)}
                className="p-0.5 shrink-0"
                style={{ color: watchlist.has(s.ticker) ? 'var(--color-heating)' : 'var(--color-parchment-border)' }}
              >
                <Bookmark size={14} fill={watchlist.has(s.ticker) ? 'var(--color-heating)' : 'none'} />
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-semibold text-[15px] text-ink">{s.ticker}</span>
                  <span className="text-[11px] text-ink-faint bg-parchment-muted px-1.5 py-0.5 rounded">{s.sector}</span>
                  <MomentumBadge momentum={s.momentum} />
                </div>
                <div className="text-[12px] text-ink-muted mt-0.5">
                  {s.name} · last mentioned{' '}
                  {s.days_since_last_mention === 0 ? 'today' : `${s.days_since_last_mention}d ago`}
                </div>
              </div>
            </div>

            {/* Right: metrics */}
            <div className="flex items-center gap-7 shrink-0">
              <div className="w-[100px]">
                <MentionTimeline histogram={s.histogram} compact />
              </div>
              <div className="w-20 text-right">
                <span className="font-semibold text-[15px] text-ink">{s.count_7d}</span>
                <span className="text-[12px] text-ink-faint"> / wk</span>
                {s.count_prev7d > 0 && (
                  <div
                    className="text-[11px]"
                    style={{ color: s.count_7d >= s.count_prev7d ? 'var(--color-buy)' : 'var(--color-sell)' }}
                  >
                    vs {s.count_prev7d} last wk
                  </div>
                )}
              </div>
              <div className="w-32">
                <ConsensusBar
                  buy={s.buy_7d}
                  hold={s.hold_7d}
                  sell={s.sell_7d}
                  showTrapWarning={s.consensus_trap}
                />
              </div>
              <div className="w-[60px] text-right">
                {s.price != null && (
                  <>
                    <div className="font-medium text-[14px] text-ink">${s.price.toLocaleString()}</div>
                    <div
                      className="text-[11px] flex items-center justify-end gap-0.5"
                      style={{ color: (s.change ?? 0) >= 0 ? 'var(--color-buy)' : 'var(--color-sell)' }}
                    >
                      {(s.change ?? 0) >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {Math.abs(s.change ?? 0)}%
                    </div>
                  </>
                )}
              </div>
              <ChevronRight size={14} className="text-ink-border" />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
