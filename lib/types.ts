export type Stance = 'buy' | 'hold' | 'sell';
export type Momentum = 'heating' | 'cooling' | 'steady';
export type YoutuberStatus = 'active' | 'pending_review' | 'rejected';
export type ArchetypeLabel = 'First Mover' | 'Momentum Trader' | 'Value Investor' | 'Macro Caller';

export interface Youtuber {
  id: string;
  channel_name: string;
  youtube_channel_id: string;
  subscriber_count: number;
  avatar_color: string;
  avatar_initials: string;
  avatar_url?: string | null;
  status: YoutuberStatus;
  vet_red_flags: string[];
  archetype: 'momentum_trader' | 'value_investor' | 'first_mover_scout' | 'macro_caller' | null;
}

export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  price?: number;
  change?: number;
  earnings_date?: string | null; // ISO date string, null = no upcoming earnings
}

export interface Mention {
  id: string;
  stock_ticker: string;
  youtuber_id: string;
  video_id: string;
  video_url: string;
  mentioned_at: string; // ISO date string — video publish date, not scrape date
  stance: Stance;
  reasoning: string;
  video_timestamp_seconds: number | null;
  price_at_call: number | null;
  price_30d_after: number | null;
  price_90d_after: number | null;
  price_1y_after: number | null;
  conviction_level: 'low' | 'medium' | 'high' | null;
  is_first_tracked_mention: boolean;
}

export interface ExplainerContent {
  ticker: string;
  what: string;
  why: string;
  backstory: string;
  related_tickers: { ticker: string; note: string }[];
  generated_at: string;
  model_version: string;
}

export interface StockSummary extends Stock {
  mentions_all: Mention[];
  mentions_7d: Mention[];
  mentions_30d: Mention[];
  count_7d: number;
  count_prev7d: number;
  buy_7d: number;
  hold_7d: number;
  sell_7d: number;
  momentum: Momentum;
  histogram: number[]; // 30 entries, index 0 = 29 days ago, index 29 = today
  last_mentioned_at: string;
  days_since_last_mention: number;
  unique_youtubers_7d: number;
  consensus_split: boolean;
  consensus_trap: boolean;
}

export interface LeaderboardEntry extends Youtuber {
  mention_count: number;
  buy_calls: number;
  stocks_covered: number;
  score: number;
}

export interface FirstMoverEntry extends Youtuber {
  mention_count: number;
  stocks_covered: number;
  first_mover_count: number;
  first_mover_pct: number;
  first_mover_tickers: string[];
}

export interface YoutuberSignalQuality {
  youtuber_id: string;
  first_mover_pct: number;
  consistency_score: number;
  contrarian_pct: number;
  total_mentions: number;
  total_stocks_covered: number;
}

export interface ChannelSubmission {
  channel_name: string;
  youtube_url: string;
  reason?: string;
}
