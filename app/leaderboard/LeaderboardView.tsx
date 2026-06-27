'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Medal, Lock, Flag } from 'lucide-react';
import YoutuberAvatar from '@/components/YoutuberAvatar';
import { archetypeFromSlug, archetypeColor } from '@/lib/archetypes';
import type { LeaderboardEntry, FirstMoverEntry } from '@/lib/types';

type Tab = 'active' | 'first_movers' | 'track_record';
type Period = 'week' | 'month' | 'year';

const MEDAL_COLORS = ['#C9A24B', '#A8A8A0', '#B0793F'];

interface Props {
  week: LeaderboardEntry[];
  month: LeaderboardEntry[];
  year: LeaderboardEntry[];
  firstMovers: FirstMoverEntry[];
}

export default function LeaderboardView({ week, month, year, firstMovers }: Props) {
  const [tab, setTab] = useState<Tab>('active');
  const [period, setPeriod] = useState<Period>('week');

  const activeBoardMap: Record<Period, LeaderboardEntry[]> = { week, month, year };
  const activeBoard = activeBoardMap[period];

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-0.5 bg-parchment-muted rounded-xl p-0.5 mb-5">
        {([
          { id: 'active', label: 'Most Active' },
          { id: 'first_movers', label: 'First Movers' },
          { id: 'track_record', label: 'Track Record', locked: true },
        ] as { id: Tab; label: string; locked?: boolean }[]).map(t => (
          <button
            key={t.id}
            onClick={() => !t.locked && setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] rounded-lg font-medium transition-colors"
            style={{
              background: tab === t.id ? 'var(--color-parchment-card)' : 'transparent',
              color: t.locked ? 'var(--color-ink-faint)' : tab === t.id ? 'var(--color-ink)' : 'var(--color-ink-muted)',
              cursor: t.locked ? 'default' : 'pointer',
            }}
          >
            {t.locked && <Lock size={11} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Most Active tab */}
      {tab === 'active' && (
        <>
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-serif text-[20px] font-semibold text-ink">Most Active</span>
            <div className="flex gap-0.5 bg-parchment-muted rounded-lg p-0.5">
              {(['week', 'month', 'year'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 text-[12px] rounded-md font-medium capitalize transition-colors"
                  style={{
                    background: period === p ? 'var(--color-parchment-card)' : 'transparent',
                    color: period === p ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                  }}
                >
                  {p === 'week' ? 'This week' : p === 'month' ? 'This month' : 'This year'}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-ink-muted mb-5 leading-relaxed">
            Who covers the most ground — ranked by how often a channel posts stock picks and how many different stocks they cover.
            This is a <em>volume</em> signal, not an accuracy signal.
          </p>
          <div className="flex flex-col gap-2">
            {activeBoard.map((y, i) => {
              const archetype = archetypeFromSlug(y.archetype);
              return (
                <div
                  key={y.id}
                  className="flex items-center gap-3.5 px-4 py-3.5 bg-parchment-card rounded-xl"
                  style={{ border: i === 0 ? '1px solid var(--color-hold)' : '1px solid var(--color-parchment-border)' }}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    {i < 3 ? (
                      <Medal size={18} color={MEDAL_COLORS[i]} fill={MEDAL_COLORS[i]} />
                    ) : (
                      <span className="font-serif text-[15px] text-ink-border font-semibold">{i + 1}</span>
                    )}
                  </div>
                  <YoutuberAvatar initials={y.avatar_initials} color={y.avatar_color} avatarUrl={y.avatar_url} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-serif font-semibold text-[14px] text-ink truncate">{y.channel_name}</div>
                      {archetype && (
                        <span
                          className="text-[10.5px] px-1.5 py-0.5 rounded font-medium shrink-0"
                          style={{ background: archetypeColor(archetype) + '1A', color: archetypeColor(archetype) }}
                        >
                          {archetype}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-ink-muted">
                      {(y.subscriber_count / 1000).toFixed(0)}K subscribers
                    </div>
                  </div>
                  <div className="text-right w-[90px] shrink-0">
                    <div className="font-semibold text-[15px] text-ink">{y.mention_count}</div>
                    <div className="text-[11px] text-ink-muted">stock calls</div>
                  </div>
                  <div className="text-right w-[90px] shrink-0">
                    <div className="font-semibold text-[15px] text-ink">{y.stocks_covered}</div>
                    <div className="text-[11px] text-ink-muted">unique stocks</div>
                  </div>
                  <Link
                    href={`/youtubers/${y.id}`}
                    className="border border-parchment-border rounded-lg px-3 py-1.5 text-[12px] text-ink-mid no-underline hover:bg-parchment-hover transition-colors shrink-0"
                  >
                    View calls
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* First Movers tab */}
      {tab === 'first_movers' && (
        <>
          <div className="mb-1">
            <span className="font-serif text-[20px] font-semibold text-ink">First Movers</span>
          </div>
          <p className="text-[11px] text-ink-muted mb-2 leading-relaxed">
            Ranked by how often a creator covers a stock <em>before</em> the majority of other tracked channels.
          </p>
          <p className="text-[13.5px] text-ink-muted mb-5 leading-relaxed bg-parchment-deep border border-parchment-border rounded-xl px-3.5 py-3">
            There are two types of finance YouTubers: <strong>researchers</strong> and <strong>repeaters</strong>.
            A researcher mentions OKLO in January when only 1 other channel is covering it — by March, 8 channels are talking about it.
            A repeater shows up in March after it's already everywhere. This tab ranks who actually did the work first.
          </p>
          <div className="flex flex-col gap-2">
            {firstMovers.map((y, i) => {
              const archetype = archetypeFromSlug(y.archetype);
              return (
                <div
                  key={y.id}
                  className="flex items-center gap-3.5 px-4 py-3.5 bg-parchment-card rounded-xl"
                  style={{ border: i === 0 ? '1px solid var(--color-hold)' : '1px solid var(--color-parchment-border)' }}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    {i < 3 ? (
                      <Medal size={18} color={MEDAL_COLORS[i]} fill={MEDAL_COLORS[i]} />
                    ) : (
                      <span className="font-serif text-[15px] text-ink-border font-semibold">{i + 1}</span>
                    )}
                  </div>
                  <YoutuberAvatar initials={y.avatar_initials} color={y.avatar_color} avatarUrl={y.avatar_url} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-serif font-semibold text-[14px] text-ink truncate">{y.channel_name}</div>
                      {archetype && (
                        <span
                          className="text-[10.5px] px-1.5 py-0.5 rounded font-medium shrink-0"
                          style={{ background: archetypeColor(archetype) + '1A', color: archetypeColor(archetype) }}
                        >
                          {archetype}
                        </span>
                      )}
                    </div>
                    {y.first_mover_tickers.length > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Flag size={10} className="text-ink-muted shrink-0" />
                        <span className="text-[12px] text-ink-muted truncate">
                          First to cover: {y.first_mover_tickers.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right w-[100px] shrink-0">
                    <div
                      className="font-semibold text-[15px]"
                      style={{ color: y.first_mover_pct >= 50 ? 'var(--color-buy)' : 'var(--color-ink-muted)' }}
                    >
                      {y.first_mover_pct}%
                    </div>
                    <div className="text-[11px] text-ink-muted">first-mover rate</div>
                  </div>
                  <div className="text-right w-[80px] shrink-0">
                    <div className="font-semibold text-[15px] text-ink">{y.stocks_covered}</div>
                    <div className="text-[11px] text-ink-muted">stocks covered</div>
                  </div>
                  <Link
                    href={`/youtubers/${y.id}`}
                    className="border border-parchment-border rounded-lg px-3 py-1.5 text-[12px] text-ink-mid no-underline hover:bg-parchment-hover transition-colors shrink-0"
                  >
                    View calls
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Track Record tab (locked) */}
      {tab === 'track_record' && (
        <div className="bg-parchment-card border border-parchment-border rounded-xl px-6 py-10 text-center">
          <Lock size={28} className="mx-auto mb-3 text-ink-faint" />
          <div className="font-serif text-[18px] font-semibold text-ink mb-2">Track Record</div>
          <p className="text-[13.5px] text-ink-mid leading-relaxed max-w-[480px] mx-auto mb-4">
            This tab ranks creators by how their calls actually performed.
            When a YouTuber says "buy NVDA at $800" we track what NVDA did 30, 90, and 180 days later — and score accordingly.
          </p>
          <p className="text-[13.5px] text-ink-muted leading-relaxed max-w-[420px] mx-auto bg-parchment-deep border border-parchment-muted rounded-xl px-4 py-3">
            It unlocks automatically once we have 30+ calls with 30-day price history — roughly
            30–60 days after the pipeline starts running. No estimates, no guessing — only real outcomes.
          </p>
        </div>
      )}
    </div>
  );
}
