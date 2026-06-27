import { daysSince } from './daysSince';
import { calcMomentum } from './momentum';
import type {
  Youtuber,
  Stock,
  Mention,
  ExplainerContent,
  StockSummary,
  LeaderboardEntry,
  FirstMoverEntry,
} from './types';

// All dates are relative to the prototype's "today" so the mock data always looks fresh.
const TODAY = new Date('2026-06-20');
function daysAgo(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ---------- YOUTUBERS ----------
export const YOUTUBERS: Youtuber[] = [
  {
    id: 'bwb', channel_name: 'Best Wallet By', youtube_channel_id: 'UCbwb',
    subscriber_count: 412000, avatar_color: '#D4A24E', avatar_initials: 'BWB',
    status: 'active', vet_red_flags: [],
    archetype: 'value_investor',
  },
  {
    id: 'imv', channel_name: 'Investing Made Vivid', youtube_channel_id: 'UCimv',
    subscriber_count: 298000, avatar_color: '#6B8F71', avatar_initials: 'IMV',
    status: 'active', vet_red_flags: [],
    archetype: 'value_investor',
  },
  {
    id: 'mta', channel_name: 'Market Tape Alex', youtube_channel_id: 'UCmta',
    subscriber_count: 780000, avatar_color: '#B05C44', avatar_initials: 'MTA',
    status: 'active', vet_red_flags: [],
    archetype: 'macro_caller',
  },
  {
    id: 'tcg', channel_name: 'The Chart Guy', youtube_channel_id: 'UCtcg',
    subscriber_count: 156000, avatar_color: '#5C7A9E', avatar_initials: 'TCG',
    status: 'active', vet_red_flags: [],
    archetype: 'momentum_trader',
  },
  {
    id: 'qcap', channel_name: 'Quiet Capital', youtube_channel_id: 'UCqcap',
    subscriber_count: 89000, avatar_color: '#8B6FA8', avatar_initials: 'QC',
    status: 'active', vet_red_flags: [],
    archetype: 'first_mover_scout',
  },
  {
    id: 'opx', channel_name: 'Options Exposed', youtube_channel_id: 'UPopx',
    subscriber_count: 203000, avatar_color: '#C77B3F', avatar_initials: 'OPX',
    status: 'active', vet_red_flags: [],
    archetype: 'momentum_trader',
  },
];

export const YOUTUBERS_BY_ID: Record<string, Youtuber> = Object.fromEntries(
  YOUTUBERS.map(y => [y.id, y])
);

// ---------- STOCKS ----------
// earnings_date: next scheduled earnings date (null = none upcoming within 30 days)
export const STOCKS: Stock[] = [
  { ticker: 'NVDA', name: 'Nvidia Corp', sector: 'AI Compute', price: 1304.22, change: 1.8, earnings_date: null },
  { ticker: 'MU', name: 'Micron Technology', sector: 'Memory', price: 218.40, change: -2.1, earnings_date: '2026-06-24' },
  { ticker: 'SNDK', name: 'SanDisk', sector: 'Memory', price: 1842.10, change: 4.3, earnings_date: null },
  { ticker: 'MRVL', name: 'Marvell Technology', sector: 'Photonics', price: 298.55, change: -1.2, earnings_date: '2026-06-26' },
  { ticker: 'COHR', name: 'Coherent Corp', sector: 'Photonics', price: 379.80, change: -3.4, earnings_date: null },
  { ticker: 'OKLO', name: 'Oklo Inc', sector: 'Nuclear/SMR', price: 61.14, change: 6.2, earnings_date: null },
  { ticker: 'BE', name: 'Bloom Energy', sector: 'Power', price: 268.90, change: 2.7, earnings_date: '2026-07-08' },
  { ticker: 'UEC', name: 'Uranium Energy Corp', sector: 'Nuclear Fuel', price: 11.42, change: -1.8, earnings_date: null },
];

export const STOCKS_BY_TICKER: Record<string, Stock> = Object.fromEntries(
  STOCKS.map(s => [s.ticker, s])
);

// ---------- RAW MENTION LOG ----------
// is_first_tracked_mention is computed after the array is declared (see bottom of this section)
const RAW_MENTIONS: Omit<Mention, 'is_first_tracked_mention'>[] = [
  // NVDA — steady drumbeat, heating up this week
  { id: 'm1', stock_ticker: 'NVDA', youtuber_id: 'bwb', video_id: 'v1', video_url: 'https://youtube.com/watch?v=v1', mentioned_at: daysAgo(27), stance: 'buy', reasoning: 'Long-term compounder, dollar-cost averaging regardless of price.', video_timestamp_seconds: 342, price_at_call: 1180.50, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm2', stock_ticker: 'NVDA', youtuber_id: 'mta', video_id: 'v2', video_url: 'https://youtube.com/watch?v=v2', mentioned_at: daysAgo(19), stance: 'buy', reasoning: 'Data center backlog extends into 2027.', video_timestamp_seconds: 127, price_at_call: 1210.00, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm3', stock_ticker: 'NVDA', youtuber_id: 'qcap', video_id: 'v3', video_url: 'https://youtube.com/watch?v=v3', mentioned_at: daysAgo(12), stance: 'buy', reasoning: 'Still the cleanest AI infrastructure exposure available.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },
  { id: 'm4', stock_ticker: 'NVDA', youtuber_id: 'tcg', video_id: 'v4', video_url: 'https://youtube.com/watch?v=v4', mentioned_at: daysAgo(6), stance: 'buy', reasoning: 'Technical breakout above prior resistance, targets new highs.', video_timestamp_seconds: 88, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },
  { id: 'm5', stock_ticker: 'NVDA', youtuber_id: 'bwb', video_id: 'v5', video_url: 'https://youtube.com/watch?v=v5', mentioned_at: daysAgo(2), stance: 'buy', reasoning: 'Sees data center backlog extending into 2027, calls it "still the cleanest AI exposure."', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm6', stock_ticker: 'NVDA', youtuber_id: 'mta', video_id: 'v6', video_url: 'https://youtube.com/watch?v=v6', mentioned_at: daysAgo(1), stance: 'buy', reasoning: 'Flags custom ASIC competition from Google/Amazon as the one risk to watch.', video_timestamp_seconds: 215, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },
  { id: 'm7', stock_ticker: 'NVDA', youtuber_id: 'imv', video_id: 'v7', video_url: 'https://youtube.com/watch?v=v7', mentioned_at: daysAgo(0), stance: 'hold', reasoning: 'Valuation stretched short-term — suggests waiting for a pullback below $1,200.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'low' },
  { id: 'm8', stock_ticker: 'NVDA', youtuber_id: 'tcg', video_id: 'v8', video_url: 'https://youtube.com/watch?v=v8', mentioned_at: daysAgo(0), stance: 'buy', reasoning: 'Momentum still intact, no reversal signal on the daily chart yet.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },

  // MU — went quiet for weeks, suddenly active again (heating)
  { id: 'm9', stock_ticker: 'MU', youtuber_id: 'qcap', video_id: 'v9', video_url: 'https://youtube.com/watch?v=v9', mentioned_at: daysAgo(34), stance: 'buy', reasoning: 'HBM capacity sold out through 2026, structural pricing power.', video_timestamp_seconds: 412, price_at_call: 188.20, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm10', stock_ticker: 'MU', youtuber_id: 'bwb', video_id: 'v10', video_url: 'https://youtube.com/watch?v=v10', mentioned_at: daysAgo(31), stance: 'buy', reasoning: 'Most under-owned AI trade in memory right now.', video_timestamp_seconds: null, price_at_call: 192.00, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm11', stock_ticker: 'MU', youtuber_id: 'mta', video_id: 'v11', video_url: 'https://youtube.com/watch?v=v11', mentioned_at: daysAgo(5), stance: 'buy', reasoning: 'Notes 2026 capacity is fully sold out — pricing power story.', video_timestamp_seconds: 178, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm12', stock_ticker: 'MU', youtuber_id: 'bwb', video_id: 'v12', video_url: 'https://youtube.com/watch?v=v12', mentioned_at: daysAgo(3), stance: 'buy', reasoning: 'Calls HBM the "most under-owned AI trade," expects guidance raise.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm13', stock_ticker: 'MU', youtuber_id: 'opx', video_id: 'v13', video_url: 'https://youtube.com/watch?v=v13', mentioned_at: daysAgo(1), stance: 'buy', reasoning: 'Elevated options premium ahead of June 24 earnings, likes calls into the print.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },
  { id: 'm14', stock_ticker: 'MU', youtuber_id: 'tcg', video_id: 'v14', video_url: 'https://youtube.com/watch?v=v14', mentioned_at: daysAgo(0), stance: 'buy', reasoning: 'Chart coiling tightly ahead of earnings, expects a breakout move.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },

  // SNDK — was hot, now cooling off
  { id: 'm15', stock_ticker: 'SNDK', youtuber_id: 'bwb', video_id: 'v15', video_url: 'https://youtube.com/watch?v=v15', mentioned_at: daysAgo(40), stance: 'buy', reasoning: 'HBF thesis makes this a multi-year story, not a one-time spike.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm16', stock_ticker: 'SNDK', youtuber_id: 'mta', video_id: 'v16', video_url: 'https://youtube.com/watch?v=v16', mentioned_at: daysAgo(35), stance: 'buy', reasoning: 'Still the cleanest pure-play memory exposure.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm17', stock_ticker: 'SNDK', youtuber_id: 'tcg', video_id: 'v17', video_url: 'https://youtube.com/watch?v=v17', mentioned_at: daysAgo(28), stance: 'buy', reasoning: 'Parabolic move but no reversal signal yet.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },
  { id: 'm18', stock_ticker: 'SNDK', youtuber_id: 'imv', video_id: 'v18', video_url: 'https://youtube.com/watch?v=v18', mentioned_at: daysAgo(14), stance: 'hold', reasoning: 'Likes the HBF thesis for 2028 but says current price already reflects it.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },
  { id: 'm19', stock_ticker: 'SNDK', youtuber_id: 'qcap', video_id: 'v19', video_url: 'https://youtube.com/watch?v=v19', mentioned_at: daysAgo(9), stance: 'hold', reasoning: 'Trimming position size after the run, not adding more here.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'low' },
  { id: 'm20', stock_ticker: 'SNDK', youtuber_id: 'imv', video_id: 'v20', video_url: 'https://youtube.com/watch?v=v20', mentioned_at: daysAgo(2), stance: 'sell', reasoning: 'Says the easy money is gone, position sizing now reckless at this valuation.', video_timestamp_seconds: 305, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },

  // MRVL — steady, S&P inclusion driving fresh mentions
  { id: 'm21', stock_ticker: 'MRVL', youtuber_id: 'qcap', video_id: 'v21', video_url: 'https://youtube.com/watch?v=v21', mentioned_at: daysAgo(22), stance: 'buy', reasoning: 'Celestial AI acquisition is the real long-term photonics story.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm22', stock_ticker: 'MRVL', youtuber_id: 'mta', video_id: 'v22', video_url: 'https://youtube.com/watch?v=v22', mentioned_at: daysAgo(8), stance: 'buy', reasoning: 'Index inclusion forces passive buying — calls it a "mechanical tailwind."', video_timestamp_seconds: 192, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },
  { id: 'm23', stock_ticker: 'MRVL', youtuber_id: 'bwb', video_id: 'v23', video_url: 'https://youtube.com/watch?v=v23', mentioned_at: daysAgo(3), stance: 'hold', reasoning: 'Wants to see Dan Durn settle in as CFO before adding more.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'low' },
  { id: 'm24', stock_ticker: 'MRVL', youtuber_id: 'mta', video_id: 'v24', video_url: 'https://youtube.com/watch?v=v24', mentioned_at: daysAgo(0), stance: 'buy', reasoning: 'S&P 500 inclusion effective this week — mechanical buying pressure begins.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },

  // COHR — dip-buying narrative building (split verdict: buy + sell present)
  { id: 'm25', stock_ticker: 'COHR', youtuber_id: 'mta', video_id: 'v25', video_url: 'https://youtube.com/watch?v=v25', mentioned_at: daysAgo(18), stance: 'buy', reasoning: "Nvidia's $2B backing still the strongest signal in the space.", video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm26', stock_ticker: 'COHR', youtuber_id: 'tcg', video_id: 'v26', video_url: 'https://youtube.com/watch?v=v26', mentioned_at: daysAgo(6), stance: 'sell', reasoning: 'Technical breakdown below 50-day average, wants to see it reclaim first.', video_timestamp_seconds: 451, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm27', stock_ticker: 'COHR', youtuber_id: 'bwb', video_id: 'v27', video_url: 'https://youtube.com/watch?v=v27', mentioned_at: daysAgo(2), stance: 'buy', reasoning: 'Calls the 20% dip "a gift," reiterates picks-and-shovels framing.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm28', stock_ticker: 'COHR', youtuber_id: 'qcap', video_id: 'v28', video_url: 'https://youtube.com/watch?v=v28', mentioned_at: daysAgo(1), stance: 'buy', reasoning: 'CPO delay is a timeline shift, not a thesis break — buying the fear.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },
  { id: 'm29', stock_ticker: 'COHR', youtuber_id: 'opx', video_id: 'v29', video_url: 'https://youtube.com/watch?v=v29', mentioned_at: daysAgo(0), stance: 'sell', reasoning: 'Implied volatility elevated post-selloff — buying puts, not calls, here.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },

  // OKLO — new mentions picking up after pullback
  { id: 'm30', stock_ticker: 'OKLO', youtuber_id: 'qcap', video_id: 'v30', video_url: 'https://youtube.com/watch?v=v30', mentioned_at: daysAgo(25), stance: 'buy', reasoning: '$2.5B cash, no debt — market is mispricing the balance sheet.', video_timestamp_seconds: 523, price_at_call: 48.30, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm31', stock_ticker: 'OKLO', youtuber_id: 'imv', video_id: 'v31', video_url: 'https://youtube.com/watch?v=v31', mentioned_at: daysAgo(11), stance: 'hold', reasoning: 'Wants to see first commercial reactor before sizing up further.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'low' },
  { id: 'm32', stock_ticker: 'OKLO', youtuber_id: 'opx', video_id: 'v32', video_url: 'https://youtube.com/watch?v=v32', mentioned_at: daysAgo(1), stance: 'buy', reasoning: 'Likes the implied volatility for a longer-dated call spread.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },
  { id: 'm33', stock_ticker: 'OKLO', youtuber_id: 'bwb', video_id: 'v33', video_url: 'https://youtube.com/watch?v=v33', mentioned_at: daysAgo(0), stance: 'buy', reasoning: 'Pullback to $61 from $194 high looks overdone given the cash position.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },

  // BE — cooling, multiple cautious calls
  { id: 'm34', stock_ticker: 'BE', youtuber_id: 'bwb', video_id: 'v34', video_url: 'https://youtube.com/watch?v=v34', mentioned_at: daysAgo(20), stance: 'buy', reasoning: 'On-site power story bypasses grid bottlenecks entirely.', video_timestamp_seconds: null, price_at_call: 142.50, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'medium' },
  { id: 'm35', stock_ticker: 'BE', youtuber_id: 'mta', video_id: 'v35', video_url: 'https://youtube.com/watch?v=v35', mentioned_at: daysAgo(4), stance: 'sell', reasoning: 'Up over 1,300% in a year — calls current entry "chasing, not investing."', video_timestamp_seconds: 388, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm36', stock_ticker: 'BE', youtuber_id: 'tcg', video_id: 'v36', video_url: 'https://youtube.com/watch?v=v36', mentioned_at: daysAgo(2), stance: 'sell', reasoning: 'RSI deeply overbought on weekly chart, expects mean reversion.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm37', stock_ticker: 'BE', youtuber_id: 'bwb', video_id: 'v37', video_url: 'https://youtube.com/watch?v=v37', mentioned_at: daysAgo(0), stance: 'hold', reasoning: 'Likes the business, just not at this price — waiting for a 20%+ pullback.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'low' },

  // UEC — light but consistent
  { id: 'm38', stock_ticker: 'UEC', youtuber_id: 'qcap', video_id: 'v38', video_url: 'https://youtube.com/watch?v=v38', mentioned_at: daysAgo(15), stance: 'buy', reasoning: 'Cheapest way to play rising uranium spot prices, no debt.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'high' },
  { id: 'm39', stock_ticker: 'UEC', youtuber_id: 'opx', video_id: 'v39', video_url: 'https://youtube.com/watch?v=v39', mentioned_at: daysAgo(3), stance: 'hold', reasoning: 'Likes the story but wants confirmation above $12 before adding.', video_timestamp_seconds: null, price_at_call: null, price_30d_after: null, price_90d_after: null, price_1y_after: null, conviction_level: 'low' },
];

// Compute is_first_tracked_mention: per ticker, the mention with the oldest mentioned_at = true
function computeFirstMentions(raw: Omit<Mention, 'is_first_tracked_mention'>[]): Mention[] {
  const firstByTicker: Record<string, string> = {};
  for (const m of raw) {
    const existing = firstByTicker[m.stock_ticker];
    if (!existing || m.mentioned_at < existing) {
      firstByTicker[m.stock_ticker] = m.mentioned_at;
    }
  }
  // Find which mention id is the first per ticker (oldest date, then first id if tie)
  const firstIdByTicker: Record<string, string> = {};
  for (const m of raw) {
    if (m.mentioned_at === firstByTicker[m.stock_ticker]) {
      if (!firstIdByTicker[m.stock_ticker]) {
        firstIdByTicker[m.stock_ticker] = m.id;
      }
    }
  }
  return raw.map(m => ({
    ...m,
    is_first_tracked_mention: firstIdByTicker[m.stock_ticker] === m.id,
  }));
}

export const MENTIONS: Mention[] = computeFirstMentions(RAW_MENTIONS);

// ---------- ELI10 EXPLAINERS ----------
export const EXPLAINERS: Record<string, ExplainerContent> = {
  NVDA: {
    ticker: 'NVDA',
    what: "Nvidia designs the chips (GPUs) that AI models are trained and run on. Think of training an AI like teaching a student by showing it millions of examples — Nvidia's chips are what does that teaching, fast.",
    why: "Every major AI company — OpenAI, Google, Meta, Microsoft — buys Nvidia chips to build their models. As AI usage grows, demand for these chips grows with it.",
    backstory: "Nvidia started in 1993 making graphics chips for video games. It turned out the same chip design that renders 3D graphics is also great at the math behind AI — so Nvidia became the accidental king of AI hardware.",
    related_tickers: [
      { ticker: 'MRVL', note: 'designs chips that help Nvidia GPUs talk to each other faster' },
      { ticker: 'MU', note: "supplies the memory that sits next to Nvidia's GPUs" },
    ],
    generated_at: '2026-06-01',
    model_version: 'mock',
  },
  MU: {
    ticker: 'MU',
    what: "Micron makes memory chips — specifically the high-speed memory (HBM) that sits right next to AI processors so they don't have to wait for data. Think of it as the GPU's short-term notepad — the faster the notepad, the faster the GPU can work.",
    why: "AI chips are only as fast as the memory feeding them. As AI models get bigger, they need more and faster memory — and there are only 3 companies in the world who can make this kind at scale.",
    backstory: "Micron is the only major memory maker headquartered in the US (the other two, SK Hynix and Samsung, are Korean). That's made it a strategic priority during US-China tech tensions.",
    related_tickers: [
      { ticker: 'SNDK', note: 'a rival memory maker, also racing to build next-gen memory' },
      { ticker: 'COHR', note: 'makes the optical components that may eventually connect memory to chips using light instead of copper' },
    ],
    generated_at: '2026-06-01',
    model_version: 'mock',
  },
  SNDK: {
    ticker: 'SNDK',
    what: "SanDisk makes flash memory and storage — the same technology family as a USB drive, but built for massive AI data centers. They're now also building a new type called 'High Bandwidth Flash' aimed at AI chips directly.",
    why: "It went from about $45 to over $1,800 in under a year because AI data centers suddenly need vastly more storage than before, and SanDisk had spare capacity exactly when demand spiked.",
    backstory: "SanDisk used to be part of Western Digital and was spun off as its own public company in 2025 — right before the AI memory boom took off, which is a big part of why the stock move has been so extreme.",
    related_tickers: [
      { ticker: 'MU', note: 'direct competitor in the memory space' },
    ],
    generated_at: '2026-06-01',
    model_version: 'mock',
  },
  MRVL: {
    ticker: 'MRVL',
    what: "Marvell designs specialized chips that help different parts of an AI data center communicate — almost like an air traffic controller for data instead of planes. They also make custom AI chips for big tech companies.",
    why: "As AI data centers get bigger, moving data between thousands of chips fast enough becomes a huge bottleneck. Marvell's chips are part of the fix — and Nvidia itself invested billions into Marvell as a partner, not a competitor.",
    backstory: "Marvell recently bought a startup called Celestial AI that was building chips using light instead of electricity to move data — a forward bet on the next generation of this technology.",
    related_tickers: [
      { ticker: 'COHR', note: "makes the physical laser/optical parts that pair with Marvell's chip designs" },
      { ticker: 'NVDA', note: 'Nvidia is both a customer and an investor in Marvell' },
    ],
    generated_at: '2026-06-01',
    model_version: 'mock',
  },
  COHR: {
    ticker: 'COHR',
    what: "Coherent makes lasers and optical components — the actual hardware that turns electrical signals into light and back again. If 'fiber optic internet' is light carrying data over long distances, Coherent makes similar tech for inside AI data centers.",
    why: "Data centers are hitting a wall: copper wires are too slow and hot for how much data AI needs to move. Light-based connections solve that, and Coherent is one of the few companies that actually manufactures the physical components for it.",
    backstory: "Nvidia invested $2 billion into Coherent specifically to secure priority access to its optical components — a strong signal of how critical this 'picks and shovels' layer is seen to be.",
    related_tickers: [
      { ticker: 'MRVL', note: "designs the silicon brain that works alongside Coherent's physical components" },
      { ticker: 'MU', note: 'memory company that could eventually connect to chips via light instead of copper' },
    ],
    generated_at: '2026-06-01',
    model_version: 'mock',
  },
  OKLO: {
    ticker: 'OKLO',
    what: "Oklo is building small nuclear reactors — much smaller than a traditional power plant — designed to be placed directly next to data centers to power them around the clock.",
    why: "AI data centers need huge, constant amounts of electricity, and the existing power grid can't easily supply it. Nuclear is the only major power source that runs 24/7 regardless of weather, unlike solar or wind.",
    backstory: "Backed early by Sam Altman (CEO of OpenAI), which gave it credibility in Silicon Valley. It hasn't generated commercial power yet — the bet is on it succeeding in the next few years.",
    related_tickers: [
      { ticker: 'UEC', note: 'mines the uranium fuel that reactors like Oklo\'s would eventually need' },
    ],
    generated_at: '2026-06-01',
    model_version: 'mock',
  },
  BE: {
    ticker: 'BE',
    what: "Bloom Energy makes fuel cells — boxes that generate electricity on-site using natural gas, without needing to connect to the power grid at all. Think of it as a power plant in a shipping container.",
    why: "Data centers often can't wait years for new grid power connections, so they pay companies like Bloom to install power generation directly on-site, bypassing the wait entirely.",
    backstory: "Bloom has been around since 2001 with mixed results for most of its life — its stock only took off dramatically once AI data center power deals (like with Oracle) started rolling in during 2025-2026.",
    related_tickers: [
      { ticker: 'OKLO', note: 'a longer-term, cleaner alternative approach to the same on-site power problem' },
    ],
    generated_at: '2026-06-01',
    model_version: 'mock',
  },
  UEC: {
    ticker: 'UEC',
    what: "Uranium Energy Corp mines uranium — the fuel that nuclear power plants and reactors burn to generate electricity. It doesn't build reactors itself, it supplies the raw fuel.",
    why: "If nuclear power for AI data centers takes off (see Oklo, Constellation Energy), someone needs to physically dig the uranium out of the ground. UEC is a U.S.-based option in a market historically dominated by Russia and Kazakhstan.",
    backstory: "UEC has been ramping up new US production sites specifically as Western countries try to reduce reliance on Russian uranium supply, a geopolitical tailwind separate from the AI story.",
    related_tickers: [
      { ticker: 'OKLO', note: 'a potential future customer if its reactors reach commercial production' },
    ],
    generated_at: '2026-06-01',
    model_version: 'mock',
  },
};

// ---------- DERIVED ANALYTICS ----------

export function buildStockSummary(ticker: string, relativeTo = TODAY): StockSummary {
  const stock = STOCKS_BY_TICKER[ticker];
  const all = MENTIONS
    .filter(m => m.stock_ticker === ticker)
    .sort((a, b) => a.mentioned_at.localeCompare(b.mentioned_at));

  const ds = (d: string) => daysSince(d, relativeTo);

  const mentions_7d = all.filter(m => ds(m.mentioned_at) <= 6);
  const prev7 = all.filter(m => ds(m.mentioned_at) > 6 && ds(m.mentioned_at) <= 13);
  const mentions_30d = all.filter(m => ds(m.mentioned_at) <= 29);

  const buy_7d = mentions_7d.filter(m => m.stance === 'buy').length;
  const hold_7d = mentions_7d.filter(m => m.stance === 'hold').length;
  const sell_7d = mentions_7d.filter(m => m.stance === 'sell').length;

  const histogram = Array.from({ length: 30 }, (_, i) => {
    const dayOffset = 29 - i;
    return all.filter(m => ds(m.mentioned_at) === dayOffset).length;
  });

  const lastMention = all[all.length - 1];

  const total_7d = buy_7d + hold_7d + sell_7d;
  const consensus_split = buy_7d >= 2 && sell_7d >= 2;
  const consensus_trap = total_7d >= 5 && (buy_7d / total_7d) > 0.85;

  return {
    ...stock,
    mentions_all: all,
    mentions_7d,
    mentions_30d,
    count_7d: mentions_7d.length,
    count_prev7d: prev7.length,
    buy_7d,
    hold_7d,
    sell_7d,
    momentum: calcMomentum(mentions_7d.length, prev7.length),
    histogram,
    last_mentioned_at: lastMention.mentioned_at,
    days_since_last_mention: ds(lastMention.mentioned_at),
    unique_youtubers_7d: new Set(mentions_7d.map(m => m.youtuber_id)).size,
    consensus_split,
    consensus_trap,
  };
}

export function buildAllStockSummaries(relativeTo = TODAY): StockSummary[] {
  return STOCKS.map(s => buildStockSummary(s.ticker, relativeTo));
}

export function buildLeaderboard(windowDays: number, relativeTo = TODAY): LeaderboardEntry[] {
  const ds = (d: string) => daysSince(d, relativeTo);
  return YOUTUBERS.map(y => {
    const mentions = MENTIONS.filter(m => m.youtuber_id === y.id && ds(m.mentioned_at) <= windowDays - 1);
    const stocks_covered = new Set(mentions.map(m => m.stock_ticker)).size;
    const score = mentions.length * 10 + stocks_covered * 4;
    return {
      ...y,
      mention_count: mentions.length,
      buy_calls: mentions.filter(m => m.stance === 'buy').length,
      stocks_covered,
      score,
    };
  }).sort((a, b) => b.score - a.score);
}

export function buildFirstMoverLeaderboard(): FirstMoverEntry[] {
  // For each youtuber, determine which stocks they called before the majority of channels
  // "First mover" = their first mention of a stock is in the earliest 25th percentile of all
  // first-mention dates across all channels for that stock
  const stocksTracked = [...new Set(MENTIONS.map(m => m.stock_ticker))];

  // For each stock, find the date each youtuber first mentioned it
  const firstMentionByYoutuberStock: Record<string, Record<string, string>> = {};
  for (const mention of MENTIONS) {
    const { youtuber_id, stock_ticker, mentioned_at } = mention;
    if (!firstMentionByYoutuberStock[youtuber_id]) {
      firstMentionByYoutuberStock[youtuber_id] = {};
    }
    const existing = firstMentionByYoutuberStock[youtuber_id][stock_ticker];
    if (!existing || mentioned_at < existing) {
      firstMentionByYoutuberStock[youtuber_id][stock_ticker] = mentioned_at;
    }
  }

  // For each stock, rank channels by when they first mentioned it
  const stockFirstMentionRanking: Record<string, string[]> = {};
  for (const ticker of stocksTracked) {
    const entries: { id: string; date: string }[] = [];
    for (const [ytId, stocks] of Object.entries(firstMentionByYoutuberStock)) {
      if (stocks[ticker]) {
        entries.push({ id: ytId, date: stocks[ticker] });
      }
    }
    entries.sort((a, b) => a.date.localeCompare(b.date));
    stockFirstMentionRanking[ticker] = entries.map(e => e.id);
  }

  return YOUTUBERS.map(y => {
    const myStocks = Object.keys(firstMentionByYoutuberStock[y.id] ?? {});
    const firstMoverTickers: string[] = [];

    for (const ticker of myStocks) {
      const ranking = stockFirstMentionRanking[ticker] ?? [];
      const myPos = ranking.indexOf(y.id);
      const threshold = Math.ceil(ranking.length * 0.25); // top 25%
      if (myPos !== -1 && myPos < threshold) {
        firstMoverTickers.push(ticker);
      }
    }

    const allMentions = MENTIONS.filter(m => m.youtuber_id === y.id);

    return {
      ...y,
      mention_count: allMentions.length,
      stocks_covered: myStocks.length,
      first_mover_count: firstMoverTickers.length,
      first_mover_pct: myStocks.length > 0 ? Math.round((firstMoverTickers.length / myStocks.length) * 100) : 0,
      first_mover_tickers: firstMoverTickers,
    };
  }).sort((a, b) => b.first_mover_pct - a.first_mover_pct || b.first_mover_count - a.first_mover_count);
}
