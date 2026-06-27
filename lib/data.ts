/**
 * Server-side data fetching from Supabase.
 * All functions here run on the server (Next.js server components / page.tsx).
 * Falls back to mock data when DB has no rows yet (empty pipeline).
 */

import { supabaseAdmin } from './supabase';
import { calcMomentum } from './momentum';
import { daysSince } from './daysSince';
import type { StockSummary, Mention, Youtuber, LeaderboardEntry, FirstMoverEntry, ExplainerContent } from './types';

// ── Helpers ──────────────────────────────────────────────────

function buildHistogram(mentions: Mention[]): number[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const counts = new Array(30).fill(0);
  for (const m of mentions) {
    const d = new Date(m.mentioned_at);
    d.setHours(0, 0, 0, 0);
    const daysAgo = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (daysAgo >= 0 && daysAgo < 30) {
      counts[29 - daysAgo]++;
    }
  }
  return counts;
}

function buildSummary(
  stock: { ticker: string; name: string; sector: string; price?: number; change?: number; earnings_date?: string | null },
  mentions: Mention[]
): StockSummary {
  const now = new Date();
  const sevenDaysAgo  = new Date(now.getTime() - 7  * 86400000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

  const mentions_7d    = mentions.filter(m => new Date(m.mentioned_at) >= sevenDaysAgo);
  const mentions_prev7 = mentions.filter(m => {
    const d = new Date(m.mentioned_at);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  });
  const mentions_30d = mentions.filter(m => {
    return new Date(m.mentioned_at) >= new Date(now.getTime() - 30 * 86400000);
  });

  const buy_7d  = mentions_7d.filter(m => m.stance === 'buy').length;
  const hold_7d = mentions_7d.filter(m => m.stance === 'hold').length;
  const sell_7d = mentions_7d.filter(m => m.stance === 'sell').length;

  const count_7d     = mentions_7d.length;
  const count_prev7d = mentions_prev7.length;
  const momentum     = calcMomentum(count_7d, count_prev7d);

  const sorted = [...mentions].sort(
    (a, b) => new Date(b.mentioned_at).getTime() - new Date(a.mentioned_at).getTime()
  );
  const lastMention = sorted[0]?.mentioned_at ?? new Date().toISOString();

  const uniqueYoutubers7d = new Set(mentions_7d.map(m => m.youtuber_id)).size;
  const consensus_trap  = buy_7d > 0 && sell_7d === 0 && buy_7d >= 3;
  const consensus_split = buy_7d >= 2 && sell_7d >= 2;

  return {
    ...stock,
    mentions_all:             sorted,
    mentions_7d,
    mentions_30d,
    count_7d,
    count_prev7d,
    buy_7d,
    hold_7d,
    sell_7d,
    momentum,
    histogram:                buildHistogram(mentions_30d),
    last_mentioned_at:        lastMention,
    days_since_last_mention:  daysSince(lastMention),
    unique_youtubers_7d:      uniqueYoutubers7d,
    consensus_split,
    consensus_trap,
  };
}

// ── Public API ───────────────────────────────────────────────

export async function getAllStockSummaries(): Promise<StockSummary[]> {
  const { data: stocks, error: stocksErr } = await supabaseAdmin
    .from('stocks')
    .select('ticker, name, sector, price, change, earnings_date')
    .order('ticker');

  if (stocksErr || !stocks?.length) {
    // No real data yet — fall back to mock
    const { buildAllStockSummaries } = await import('./mock-data');
    return buildAllStockSummaries();
  }

  const { data: mentions } = await supabaseAdmin
    .from('mentions')
    .select('*')
    .gte('mentioned_at', new Date(Date.now() - 30 * 86400000).toISOString())
    .order('mentioned_at', { ascending: false });

  const mentionsByTicker: Record<string, Mention[]> = {};
  for (const m of mentions ?? []) {
    if (!mentionsByTicker[m.stock_ticker]) mentionsByTicker[m.stock_ticker] = [];
    mentionsByTicker[m.stock_ticker].push(m as Mention);
  }

  return stocks
    .map(s => buildSummary(s, mentionsByTicker[s.ticker] ?? []))
    .filter(s => s.mentions_all.length > 0) // only show stocks with real data
    .sort((a, b) => b.count_7d - a.count_7d);
}

export async function getStockSummary(ticker: string): Promise<StockSummary | null> {
  const upper = ticker.toUpperCase();

  const { data: stock } = await supabaseAdmin
    .from('stocks')
    .select('ticker, name, sector, price, change, earnings_date')
    .eq('ticker', upper)
    .single();

  if (!stock) {
    // Fall back to mock
    const { buildAllStockSummaries } = await import('./mock-data');
    return buildAllStockSummaries().find(s => s.ticker === upper) ?? null;
  }

  const { data: mentions } = await supabaseAdmin
    .from('mentions')
    .select('*')
    .eq('stock_ticker', upper)
    .order('mentioned_at', { ascending: false });

  return buildSummary(stock, (mentions ?? []) as Mention[]);
}

export async function getYoutubers(): Promise<Youtuber[]> {
  const { data, error } = await supabaseAdmin
    .from('youtubers')
    .select('*')
    .eq('status', 'active')
    .order('subscriber_count', { ascending: false });

  if (error || !data?.length) {
    const { YOUTUBERS } = await import('./mock-data');
    return YOUTUBERS;
  }

  return data.map(y => ({
    ...y,
    vet_red_flags: [],
  })) as Youtuber[];
}

export async function getYoutuberWithMentions(id: string) {
  const { data: youtuber } = await supabaseAdmin
    .from('youtubers')
    .select('*')
    .eq('id', id)
    .single();

  if (!youtuber) {
    const { YOUTUBERS, MENTIONS } = await import('./mock-data');
    const yt = YOUTUBERS.find(y => y.id === id);
    if (!yt) return null;
    return { youtuber: yt, mentions: MENTIONS.filter(m => m.youtuber_id === id) };
  }

  const { data: mentions } = await supabaseAdmin
    .from('mentions')
    .select('*')
    .eq('youtuber_id', id)
    .order('mentioned_at', { ascending: false });

  return {
    youtuber: { ...youtuber, vet_red_flags: [] } as Youtuber,
    mentions: (mentions ?? []) as Mention[],
  };
}

export async function getLeaderboard(period: 'week' | 'month' | 'year') {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: youtubers } = await supabaseAdmin
    .from('youtubers')
    .select('*')
    .eq('status', 'active');

  const { data: mentions } = await supabaseAdmin
    .from('mentions')
    .select('youtuber_id, stock_ticker, stance')
    .gte('mentioned_at', since);

  if (!youtubers?.length || !mentions?.length) {
    const { buildLeaderboard } = await import('./mock-data');
    return buildLeaderboard(days);
  }

  const stats: Record<string, { mention_count: number; stocks: Set<string>; buy_calls: number }> = {};
  for (const m of mentions) {
    if (!stats[m.youtuber_id]) stats[m.youtuber_id] = { mention_count: 0, stocks: new Set(), buy_calls: 0 };
    stats[m.youtuber_id].mention_count++;
    stats[m.youtuber_id].stocks.add(m.stock_ticker);
    if (m.stance === 'buy') stats[m.youtuber_id].buy_calls++;
  }

  return youtubers
    .filter(y => stats[y.id])
    .map(y => ({
      ...y,
      vet_red_flags: [],
      mention_count:  stats[y.id].mention_count,
      buy_calls:      stats[y.id].buy_calls,
      stocks_covered: stats[y.id].stocks.size,
      score:          stats[y.id].mention_count * 10 + stats[y.id].stocks.size * 4,
    }))
    .sort((a, b) => b.score - a.score) as LeaderboardEntry[];
}

export async function getExplainer(ticker: string): Promise<ExplainerContent | null> {
  const { data } = await supabaseAdmin
    .from('explainers')
    .select('*')
    .eq('ticker', ticker.toUpperCase())
    .single();

  return data as ExplainerContent | null;
}

export async function getFirstMovers(): Promise<FirstMoverEntry[]> {
  const { data: youtubers } = await supabaseAdmin
    .from('youtubers')
    .select('*')
    .eq('status', 'active');

  const { data: mentions } = await supabaseAdmin
    .from('mentions')
    .select('youtuber_id, stock_ticker, is_first_tracked_mention');

  if (!youtubers?.length || !mentions?.length) {
    const { buildFirstMoverLeaderboard } = await import('./mock-data');
    return buildFirstMoverLeaderboard();
  }

  const stats: Record<string, { total: number; stocks: Set<string>; first_tickers: string[] }> = {};
  for (const m of mentions) {
    if (!stats[m.youtuber_id]) stats[m.youtuber_id] = { total: 0, stocks: new Set(), first_tickers: [] };
    stats[m.youtuber_id].total++;
    stats[m.youtuber_id].stocks.add(m.stock_ticker);
    if (m.is_first_tracked_mention) stats[m.youtuber_id].first_tickers.push(m.stock_ticker);
  }

  return youtubers
    .filter(y => stats[y.id])
    .map(y => ({
      ...y,
      vet_red_flags: [],
      mention_count:        stats[y.id].total,
      stocks_covered:       stats[y.id].stocks.size,
      first_mover_count:    stats[y.id].first_tickers.length,
      first_mover_pct:      Math.round(stats[y.id].first_tickers.length / stats[y.id].stocks.size * 100),
      first_mover_tickers:  stats[y.id].first_tickers,
      score:                stats[y.id].total * 10 + stats[y.id].stocks.size * 4,
      buy_calls:            0,
    }))
    .sort((a, b) => b.first_mover_pct - a.first_mover_pct) as FirstMoverEntry[];
}
