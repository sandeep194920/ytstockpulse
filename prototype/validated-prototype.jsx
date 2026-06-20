import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Search, ChevronRight, Flame, Calendar, BarChart3, Users, Bookmark, ExternalLink, ArrowUpRight, ArrowDownRight, Snowflake, Zap, Trophy, AlertCircle, Send, X, Medal, CheckCircle2, Info, BookOpen, Link2 } from 'lucide-react';

// ---------- SAMPLE DATA ----------
const youtubers = [
  { id: 'bwb', name: 'Best Wallet By', subs: '412K', avatar: 'BWB', color: '#D4A24E' },
  { id: 'imv', name: 'Investing Made Vivid', subs: '298K', avatar: 'IMV', color: '#6B8F71' },
  { id: 'mta', name: 'Market Tape Alex', subs: '780K', avatar: 'MTA', color: '#B05C44' },
  { id: 'tcg', name: 'The Chart Guy', subs: '156K', avatar: 'TCG', color: '#5C7A9E' },
  { id: 'qcap', name: 'Quiet Capital', subs: '89K', avatar: 'QC', color: '#8B6FA8' },
  { id: 'opx', name: 'Options Exposed', subs: '203K', avatar: 'OPX', color: '#C77B3F' },
];
const ytById = Object.fromEntries(youtubers.map(y => [y.id, y]));

// Helper: build a date N days before "today" (June 20, 2026)
const TODAY = new Date('2026-06-20');
const daysAgo = (n) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

// ---------- RAW MENTION LOG ----------
// Each row = one youtuber talking about one stock on one date. This is the real data model.
const mentionLog = [
  // NVDA — steady drumbeat, heating up this week
  { stock: 'NVDA', yt: 'bwb', date: daysAgo(27), stance: 'buy', point: 'Long-term compounder, dollar-cost averaging regardless of price.' },
  { stock: 'NVDA', yt: 'mta', date: daysAgo(19), stance: 'buy', point: 'Data center backlog extends into 2027.' },
  { stock: 'NVDA', yt: 'qcap', date: daysAgo(12), stance: 'buy', point: 'Still the cleanest AI infrastructure exposure available.' },
  { stock: 'NVDA', yt: 'tcg', date: daysAgo(6), stance: 'buy', point: 'Technical breakout above prior resistance, targets new highs.' },
  { stock: 'NVDA', yt: 'bwb', date: daysAgo(2), stance: 'buy', point: 'Sees data center backlog extending into 2027, calls it "still the cleanest AI exposure."' },
  { stock: 'NVDA', yt: 'mta', date: daysAgo(1), stance: 'buy', point: 'Flags custom ASIC competition from Google/Amazon as the one risk to watch.' },
  { stock: 'NVDA', yt: 'imv', date: daysAgo(0), stance: 'hold', point: 'Valuation stretched short-term — suggests waiting for a pullback below $1,200.' },
  { stock: 'NVDA', yt: 'tcg', date: daysAgo(0), stance: 'buy', point: 'Momentum still intact, no reversal signal on the daily chart yet.' },

  // MU — went quiet for weeks, suddenly active again ahead of earnings (classic "heating up")
  { stock: 'MU', yt: 'qcap', date: daysAgo(34), stance: 'buy', point: 'HBM capacity sold out through 2026, structural pricing power.' },
  { stock: 'MU', yt: 'bwb', date: daysAgo(31), stance: 'buy', point: 'Most under-owned AI trade in memory right now.' },
  // ...then 24 days of silence...
  { stock: 'MU', yt: 'mta', date: daysAgo(5), stance: 'buy', point: 'Notes 2026 capacity is fully sold out — pricing power story.' },
  { stock: 'MU', yt: 'bwb', date: daysAgo(3), stance: 'buy', point: 'Calls HBM the "most under-owned AI trade," expects guidance raise.' },
  { stock: 'MU', yt: 'opx', date: daysAgo(1), stance: 'buy', point: 'Elevated options premium ahead of June 24 earnings, likes calls into the print.' },
  { stock: 'MU', yt: 'tcg', date: daysAgo(0), stance: 'buy', point: 'Chart coiling tightly ahead of earnings, expects a breakout move.' },

  // SNDK — was extremely hot, now cooling off / going quiet (the inverse signal)
  { stock: 'SNDK', yt: 'bwb', date: daysAgo(40), stance: 'buy', point: 'HBF thesis makes this a multi-year story, not a one-time spike.' },
  { stock: 'SNDK', yt: 'mta', date: daysAgo(35), stance: 'buy', point: 'Still the cleanest pure-play memory exposure.' },
  { stock: 'SNDK', yt: 'tcg', date: daysAgo(28), stance: 'buy', point: 'Parabolic move but no reversal signal yet.' },
  { stock: 'SNDK', yt: 'imv', date: daysAgo(14), stance: 'hold', point: 'Likes the HBF thesis for 2028 but says current price already reflects it.' },
  { stock: 'SNDK', yt: 'qcap', date: daysAgo(9), stance: 'hold', point: 'Trimming position size after the run, not adding more here.' },
  { stock: 'SNDK', yt: 'imv', date: daysAgo(2), stance: 'sell', point: 'Says the easy money is gone, position sizing now reckless at this valuation.' },
  // nothing in the last 2 days — cooling off

  // MRVL — steady, S&P inclusion driving fresh mentions this week
  { stock: 'MRVL', yt: 'qcap', date: daysAgo(22), stance: 'buy', point: 'Celestial AI acquisition is the real long-term photonics story.' },
  { stock: 'MRVL', yt: 'mta', date: daysAgo(8), stance: 'buy', point: 'Index inclusion forces passive buying — calls it a "mechanical tailwind."' },
  { stock: 'MRVL', yt: 'bwb', date: daysAgo(3), stance: 'hold', point: 'Wants to see Dan Durn settle in as CFO before adding more.' },
  { stock: 'MRVL', yt: 'mta', date: daysAgo(0), stance: 'buy', point: 'S&P 500 inclusion effective this week — mechanical buying pressure begins.' },

  // COHR — dip-buying narrative building over the last week
  { stock: 'COHR', yt: 'mta', date: daysAgo(18), stance: 'buy', point: "Nvidia's $2B backing still the strongest signal in the space." },
  { stock: 'COHR', yt: 'tcg', date: daysAgo(6), stance: 'sell', point: 'Technical breakdown below 50-day average, wants to see it reclaim first.' },
  { stock: 'COHR', yt: 'bwb', date: daysAgo(2), stance: 'buy', point: 'Calls the 20% dip "a gift," reiterates picks-and-shovels framing.' },
  { stock: 'COHR', yt: 'qcap', date: daysAgo(1), stance: 'buy', point: 'CPO delay is a timeline shift, not a thesis break — buying the fear.' },
  { stock: 'COHR', yt: 'opx', date: daysAgo(0), stance: 'buy', point: 'Implied volatility elevated post-selloff, likes calls for the bounce.' },

  // OKLO — new mentions picking up after pullback
  { stock: 'OKLO', yt: 'qcap', date: daysAgo(25), stance: 'buy', point: '$2.5B cash, no debt — market is mispricing the balance sheet.' },
  { stock: 'OKLO', yt: 'imv', date: daysAgo(11), stance: 'hold', point: 'Wants to see first commercial reactor before sizing up further.' },
  { stock: 'OKLO', yt: 'opx', date: daysAgo(1), stance: 'buy', point: 'Likes the implied volatility for a longer-dated call spread.' },
  { stock: 'OKLO', yt: 'bwb', date: daysAgo(0), stance: 'buy', point: 'Pullback to $61 from $194 high looks overdone given the cash position.' },

  // BE — cooling sharply, multiple cautious calls recently
  { stock: 'BE', yt: 'bwb', date: daysAgo(20), stance: 'buy', point: 'On-site power story bypasses grid bottlenecks entirely.' },
  { stock: 'BE', yt: 'mta', date: daysAgo(4), stance: 'sell', point: 'Up over 1,300% in a year — calls current entry "chasing, not investing."' },
  { stock: 'BE', yt: 'tcg', date: daysAgo(2), stance: 'sell', point: 'RSI deeply overbought on weekly chart, expects mean reversion.' },
  { stock: 'BE', yt: 'bwb', date: daysAgo(0), stance: 'hold', point: 'Likes the business, just not at this price — waiting for a 20%+ pullback.' },

  // UEC — light but consistent
  { stock: 'UEC', yt: 'qcap', date: daysAgo(15), stance: 'buy', point: 'Cheapest way to play rising uranium spot prices, no debt.' },
  { stock: 'UEC', yt: 'opx', date: daysAgo(3), stance: 'hold', point: 'Likes the story but wants confirmation above $12 before adding.' },
];

const stockMeta = {
  NVDA: { name: 'Nvidia Corp', price: 1304.22, change: 1.8, sector: 'AI Compute' },
  MU: { name: 'Micron Technology', price: 218.40, change: -2.1, sector: 'Memory' },
  SNDK: { name: 'SanDisk', price: 1842.10, change: 4.3, sector: 'Memory' },
  MRVL: { name: 'Marvell Technology', price: 298.55, change: -1.2, sector: 'Photonics' },
  COHR: { name: 'Coherent Corp', price: 379.80, change: -3.4, sector: 'Photonics' },
  OKLO: { name: 'Oklo Inc', price: 61.14, change: 6.2, sector: 'Nuclear/SMR' },
  BE: { name: 'Bloom Energy', price: 268.90, change: 2.7, sector: 'Power' },
  UEC: { name: 'Uranium Energy Corp', price: 11.42, change: -1.8, sector: 'Nuclear Fuel' },
};

// ---------- ELI10 EXPLAINERS ----------
// Drafted once per ticker, cached — not pulled from any single YouTuber's video.
// Plain-English "what does this company actually do" + why it's in the news + how it connects to other tracked stocks.
const explainers = {
  NVDA: {
    what: "Nvidia designs the chips (GPUs) that AI models are trained and run on. Think of training an AI like teaching a student by showing it millions of examples — Nvidia's chips are what does that teaching, fast.",
    why: "Every major AI company — OpenAI, Google, Meta, Microsoft — buys Nvidia chips to build their models. As AI usage grows, demand for these chips grows with it.",
    backstory: "Nvidia started in 1993 making graphics chips for video games. It turned out the same chip design that renders 3D graphics is also great at the math behind AI — so Nvidia became the accidental king of AI hardware.",
    related: [
      { ticker: 'MRVL', note: 'designs chips that help Nvidia GPUs talk to each other faster' },
      { ticker: 'MU', note: 'supplies the memory that sits next to Nvidia\'s GPUs' },
    ],
  },
  MU: {
    what: "Micron makes memory chips — specifically the high-speed memory (HBM) that sits right next to AI processors so they don't have to wait for data. Think of it as the GPU's short-term notepad — the faster the notepad, the faster the GPU can work.",
    why: "AI chips are only as fast as the memory feeding them. As AI models get bigger, they need more and faster memory — and there are only 3 companies in the world who can make this kind at scale.",
    backstory: "Micron is the only major memory maker headquartered in the US (the other two, SK Hynix and Samsung, are Korean). That's made it a strategic priority during US-China tech tensions.",
    related: [
      { ticker: 'SNDK', note: 'a rival memory maker, also racing to build next-gen memory' },
      { ticker: 'COHR', note: 'makes the optical components that may eventually connect memory to chips using light instead of copper' },
    ],
  },
  SNDK: {
    what: "SanDisk makes flash memory and storage — the same technology family as a USB drive, but built for massive AI data centers. They're now also building a new type called 'High Bandwidth Flash' aimed at AI chips directly.",
    why: "It went from about $45 to over $1,800 in under a year because AI data centers suddenly need vastly more storage than before, and SanDisk had spare capacity exactly when demand spiked.",
    backstory: "SanDisk used to be part of Western Digital and was spun off as its own public company in 2025 — right before the AI memory boom took off, which is a big part of why the stock move has been so extreme.",
    related: [
      { ticker: 'MU', note: 'direct competitor in the memory space' },
    ],
  },
  MRVL: {
    what: "Marvell designs specialized chips that help different parts of an AI data center communicate — almost like an air traffic controller for data instead of planes. They also make custom AI chips for big tech companies.",
    why: "As AI data centers get bigger, moving data between thousands of chips fast enough becomes a huge bottleneck. Marvell's chips are part of the fix — and Nvidia itself invested billions into Marvell as a partner, not a competitor.",
    backstory: "Marvell recently bought a startup called Celestial AI that was building chips using light instead of electricity to move data — a forward bet on the next generation of this technology.",
    related: [
      { ticker: 'COHR', note: 'makes the physical laser/optical parts that pair with Marvell\'s chip designs' },
      { ticker: 'NVDA', note: 'Nvidia is both a customer and an investor in Marvell' },
    ],
  },
  COHR: {
    what: "Coherent makes lasers and optical components — the actual hardware that turns electrical signals into light and back again. If 'fiber optic internet' is light carrying data over long distances, Coherent makes similar tech for inside AI data centers.",
    why: "Data centers are hitting a wall: copper wires are too slow and hot for how much data AI needs to move. Light-based connections solve that, and Coherent is one of the few companies that actually manufactures the physical components for it.",
    backstory: "Nvidia invested $2 billion into Coherent specifically to secure priority access to its optical components — a strong signal of how critical this 'picks and shovels' layer is seen to be.",
    related: [
      { ticker: 'MRVL', note: 'designs the silicon brain that works alongside Coherent\'s physical components' },
      { ticker: 'MU', note: 'memory company that could eventually connect to chips via light instead of copper' },
    ],
  },
  OKLO: {
    what: "Oklo is building small nuclear reactors — much smaller than a traditional power plant — designed to be placed directly next to data centers to power them around the clock.",
    why: "AI data centers need huge, constant amounts of electricity, and the existing power grid can't easily supply it. Nuclear is the only major power source that runs 24/7 regardless of weather, unlike solar or wind.",
    backstory: "Backed early by Sam Altman (CEO of OpenAI), which gave it credibility in Silicon Valley. It hasn't generated commercial power yet — the bet is on it succeeding in the next few years.",
    related: [
      { ticker: 'UEC', note: 'mines the uranium fuel that reactors like Oklo\'s would eventually need' },
    ],
  },
  BE: {
    what: "Bloom Energy makes fuel cells — boxes that generate electricity on-site using natural gas, without needing to connect to the power grid at all. Think of it as a power plant in a shipping container.",
    why: "Data centers often can't wait years for new grid power connections, so they pay companies like Bloom to install power generation directly on-site, bypassing the wait entirely.",
    backstory: "Bloom has been around since 2001 with mixed results for most of its life — its stock only took off dramatically once AI data center power deals (like with Oracle) started rolling in during 2025-2026.",
    related: [
      { ticker: 'OKLO', note: 'a longer-term, cleaner alternative approach to the same on-site power problem' },
    ],
  },
  UEC: {
    what: "Uranium Energy Corp mines uranium — the fuel that nuclear power plants and reactors burn to generate electricity. It doesn't build reactors itself, it supplies the raw fuel.",
    why: "If nuclear power for AI data centers takes off (see Oklo, Constellation Energy), someone needs to physically dig the uranium out of the ground. UEC is a U.S.-based option in a market historically dominated by Russia and Kazakhstan.",
    backstory: "UEC has been ramping up new US production sites specifically as Western countries try to reduce reliance on Russian uranium supply, a geopolitical tailwind separate from the AI story.",
    related: [
      { ticker: 'OKLO', note: 'a potential future customer if its reactors reach commercial production' },
    ],
  },
};

const stanceConfig = {
  buy: { label: 'Buy', color: '#3F7D58', bg: '#E8F2EA' },
  hold: { label: 'Hold', color: '#A07A2E', bg: '#FAF1E0' },
  sell: { label: 'Overpriced', color: '#B04A3F', bg: '#F7E9E7' },
};

// ---------- DERIVED ANALYTICS ----------
function daysSince(dateStr) {
  return Math.round((TODAY - new Date(dateStr)) / 86400000);
}

function buildStockSummaries() {
  const tickers = Object.keys(stockMeta);
  return tickers.map(ticker => {
    const all = mentionLog.filter(m => m.stock === ticker).sort((a, b) => new Date(a.date) - new Date(b.date));
    const last7 = all.filter(m => daysSince(m.date) <= 6);
    const prev7 = all.filter(m => daysSince(m.date) > 6 && daysSince(m.date) <= 13);
    const last30 = all.filter(m => daysSince(m.date) <= 29);

    const buy = last7.filter(m => m.stance === 'buy').length;
    const hold = last7.filter(m => m.stance === 'hold').length;
    const sell = last7.filter(m => m.stance === 'sell').length;

    const lastMention = all[all.length - 1];
    const gapBeforeLast = all.length > 1 ? daysSince(all[all.length - 2].date) - daysSince(lastMention.date) : null;

    let momentum = 'steady';
    if (last7.length > prev7.length + 1) momentum = 'heating';
    else if (last7.length === 0 && prev7.length > 0) momentum = 'cooling';
    else if (last7.length < prev7.length && prev7.length > 0) momentum = 'cooling';

    // build 30-day daily histogram for sparkline (most recent 30 days, index 0 = 29 days ago)
    const histogram = Array.from({ length: 30 }, (_, i) => {
      const dayOffset = 29 - i;
      return all.filter(m => daysSince(m.date) === dayOffset).length;
    });

    return {
      ticker, ...stockMeta[ticker],
      all, last7, last30,
      mentions7d: last7.length,
      mentionsPrev7d: prev7.length,
      buy, hold, sell,
      momentum,
      histogram,
      lastMentionDate: lastMention.date,
      daysSinceLastMention: daysSince(lastMention.date),
      uniqueYoutubers7d: new Set(last7.map(m => m.yt)).size,
    };
  });
}

const stockSummaries = buildStockSummaries();

// ---------- YOUTUBER LEADERBOARD ----------
// Ranked by activity (mentions) + engagement (subs) as a simple v1 score.
// Accuracy scoring needs weeks/months of price-after-call data before it's fair to show — noted as "coming soon" in the UI.
function buildLeaderboard(windowDays) {
  return youtubers.map(y => {
    const mentions = mentionLog.filter(m => m.yt === y.id && daysSince(m.date) <= windowDays - 1);
    const buyCalls = mentions.filter(m => m.stance === 'buy').length;
    const stocksCovered = new Set(mentions.map(m => m.stock)).size;
    const subsNum = parseFloat(y.subs) * 1000;
    // simple v1 activity score — not an accuracy claim
    const score = mentions.length * 10 + stocksCovered * 4;
    return { ...y, mentionCount: mentions.length, buyCalls, stocksCovered, score, subsNum };
  }).sort((a, b) => b.score - a.score);
}

const leaderboardWeek = buildLeaderboard(7);
const leaderboardMonth = buildLeaderboard(30);
const leaderboardYear = buildLeaderboard(365);

const momentumConfig = {
  heating: { label: 'Heating up', icon: Flame, color: '#B05C44', bg: '#F7E9E2' },
  cooling: { label: 'Going quiet', icon: Snowflake, color: '#5C7A9E', bg: '#E9EFF4' },
  steady: { label: 'Steady', icon: Zap, color: '#8A8270', bg: '#EFEAE0' },
};

function ConsensusBar({ buy, hold, sell }) {
  const total = buy + hold + sell || 1;
  const bp = (buy / total) * 100, hp = (hold / total) * 100, sp = (sell / total) * 100;
  return (
    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', width: '100%', background: '#EEEAE2' }}>
      <div style={{ width: `${bp}%`, background: stanceConfig.buy.color }} />
      <div style={{ width: `${hp}%`, background: stanceConfig.hold.color }} />
      <div style={{ width: `${sp}%`, background: stanceConfig.sell.color }} />
    </div>
  );
}

// 30-day mention timeline — the key new visual
function MentionTimeline({ histogram, compact }) {
  const max = Math.max(...histogram, 1);
  const h = compact ? 24 : 44;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: compact ? 1.5 : 2.5, height: h }}>
      {histogram.map((v, i) => {
        const dayOffset = 29 - i;
        const isToday = dayOffset === 0;
        const barH = v === 0 ? 2 : Math.max(4, (v / max) * h);
        return (
          <div key={i} title={`${v} mention${v === 1 ? '' : 's'} · ${dayOffset === 0 ? 'today' : dayOffset + 'd ago'}`}
            style={{
              width: compact ? 3 : 5, height: barH, borderRadius: 1.5,
              background: v === 0 ? '#E5DFD2' : (isToday ? '#1F1B16' : '#B0A78F'),
              flexShrink: 0,
            }} />
        );
      })}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('stocks');
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedYt, setSelectedYt] = useState(null);
  const [query, setQuery] = useState('');
  const [watchlist, setWatchlist] = useState(new Set(['NVDA', 'OKLO']));
  const [sortBy, setSortBy] = useState('momentum'); // momentum | mentions | conviction
  const [watchlistSort, setWatchlistSort] = useState('popularity'); // popularity | momentum | conviction | alpha
  const [expandedWatch, setExpandedWatch] = useState(new Set(['NVDA']));
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('week'); // week | month | year
  const [submitForm, setSubmitForm] = useState({ channel: '', url: '', reason: '' });
  const [submitted, setSubmitted] = useState(false);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [explainerTicker, setExplainerTicker] = useState(null);
  const [hasSeenHint, setHasSeenHint] = useState(false);

  useEffect(() => {
    // one-time discovery nudge, shown once then never again (would persist via localStorage in production)
    const seen = false; // sample-mode default: always show once on load
    if (!seen) {
      const t = setTimeout(() => setHasSeenHint(true), 100);
      return () => clearTimeout(t);
    }
  }, []);

  const openExplainer = (ticker) => {
    setExplainerTicker(ticker);
    setExplainerOpen(true);
  };

  const toggleExpand = (ticker) => {
    setExpandedWatch(prev => {
      const next = new Set(prev);
      next.has(ticker) ? next.delete(ticker) : next.add(ticker);
      return next;
    });
  };

  const sortedWatchlist = useMemo(() => {
    const list = stockSummaries.filter(s => watchlist.has(s.ticker));
    if (watchlistSort === 'popularity') return list.sort((a, b) => b.mentions7d - a.mentions7d);
    if (watchlistSort === 'momentum') {
      const order = { heating: 0, steady: 1, cooling: 2 };
      return list.sort((a, b) => order[a.momentum] - order[b.momentum] || b.mentions7d - a.mentions7d);
    }
    if (watchlistSort === 'conviction') return list.sort((a, b) => (b.buy - b.sell) - (a.buy - a.sell));
    return list.sort((a, b) => a.ticker.localeCompare(b.ticker));
  }, [watchlist, watchlistSort]);

  const filtered = useMemo(() => {
    let list = stockSummaries.filter(s => s.ticker.toLowerCase().includes(query.toLowerCase()) || s.name.toLowerCase().includes(query.toLowerCase()));
    if (sortBy === 'momentum') {
      const order = { heating: 0, steady: 1, cooling: 2 };
      list = list.sort((a, b) => order[a.momentum] - order[b.momentum] || b.mentions7d - a.mentions7d);
    } else if (sortBy === 'mentions') {
      list = list.sort((a, b) => b.mentions7d - a.mentions7d);
    } else {
      list = list.sort((a, b) => (b.buy - b.sell) - (a.buy - a.sell));
    }
    return list;
  }, [query, sortBy]);

  const toggleWatch = (ticker) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      next.has(ticker) ? next.delete(ticker) : next.add(ticker);
      return next;
    });
  };

  const heatingCount = stockSummaries.filter(s => s.momentum === 'heating').length;

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", background: '#F7F4EE', minHeight: '100vh', color: '#1F1B16', fontSize: 14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap');
        * { box-sizing: border-box; }
        .serif { font-family: 'Fraunces', serif; }
        .hover-row:hover { background: #EFEAE0 !important; cursor: pointer; }
        .tab-btn:hover { opacity: 0.7; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #D4CCBC; border-radius: 4px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {showDisclaimer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(31,27,22,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .2s ease' }}>
          <div style={{ background: '#FBF9F4', borderRadius: 14, padding: 28, maxWidth: 440, width: '100%', animation: 'slideUp .25s ease', border: '1px solid #DDD5C4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F2EEE4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircle size={18} color="#B05C44" />
              </div>
              <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Before you dive in</span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#5C5546', marginBottom: 10 }}>
              <strong>ytstockpulse is not financial advice.</strong> Everything here is a summary of opinions expressed publicly by YouTube creators — not analysis from licensed financial advisors, and not a recommendation from us.
            </p>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#5C5546', marginBottom: 20 }}>
              YouTubers can be wrong, biased, or paid to promote a stock without disclosure. Use this as a starting point for your own research, not a substitute for it.
            </p>
            <button onClick={() => setShowDisclaimer(false)}
              style={{ width: '100%', padding: '11px', background: '#1F1B16', color: '#F7F4EE', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              I understand, take me in
            </button>
          </div>
        </div>
      )}


      <div style={{ borderBottom: '1px solid #DDD5C4', background: '#FBF9F4', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span className="serif" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>ytstockpulse</span>
              <span style={{ fontSize: 11, color: '#8A8270', textTransform: 'uppercase', letterSpacing: '0.08em' }}>daily consensus, 2-minute read</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#8A8270' }}>
              <Calendar size={13} />
              <span>June 20, 2026 · 142 videos scanned today</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'stocks', label: 'By stock', icon: BarChart3 },
              { id: 'youtubers', label: 'By YouTuber', icon: Users },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { id: 'watchlist', label: `Watchlist (${watchlist.size})`, icon: Bookmark },
              { id: 'submit', label: 'Suggest a channel', icon: Send },
            ].map(t => (
              <button key={t.id} className="tab-btn" onClick={() => { setView(t.id); setSelectedStock(null); setSelectedYt(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 500,
                  background: view === t.id ? '#1F1B16' : 'transparent', color: view === t.id ? '#F7F4EE' : '#5C5546',
                  border: 'none', borderRadius: '6px 6px 0 0', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Persistent disclaimer strip */}
        <div style={{ background: '#F2EEE4', borderTop: '1px solid #DDD5C4', padding: '7px 24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: 1140, width: '100%', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8A8270' }}>
            <AlertCircle size={12} style={{ flexShrink: 0 }} />
            <span>This page summarizes public YouTuber opinions. It is not financial advice — always do your own research.</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '24px' }}>

        {view === 'stocks' && !selectedStock && (
          <>
            {heatingCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7E9E2', border: '1px solid #E8CFC0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#B05C44' }}>
                <Flame size={14} />
                <span><strong>{heatingCount} stocks heating up</strong> — more YouTubers mentioning them this week than last week</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center' }}>
              <Search size={15} color="#8A8270" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search ticker or company..."
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #DDD5C4', borderRadius: 8, background: '#FFFEFB', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              <div style={{ display: 'flex', gap: 2, background: '#EFEAE0', borderRadius: 8, padding: 3 }}>
                {[{ id: 'momentum', label: 'Momentum' }, { id: 'mentions', label: 'Mentions' }, { id: 'conviction', label: 'Conviction' }].map(opt => (
                  <button key={opt.id} onClick={() => setSortBy(opt.id)}
                    style={{ padding: '6px 10px', fontSize: 11.5, border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                      background: sortBy === opt.id ? '#FBF9F4' : 'transparent', color: sortBy === opt.id ? '#1F1B16' : '#8A8270' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#8A8270', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span>Stock</span>
              <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
                <span style={{ width: 100 }}>30-day mention pattern</span>
                <span style={{ width: 80, textAlign: 'right' }}>This week</span>
                <span style={{ width: 130 }}>Consensus</span>
                <span style={{ width: 60, textAlign: 'right' }}>Price</span>
                <span style={{ width: 20 }}></span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#DDD5C4', borderRadius: 10, overflow: 'hidden', border: '1px solid #DDD5C4' }}>
              {filtered.map(s => {
                const mc = momentumConfig[s.momentum];
                return (
                  <div key={s.ticker} className="hover-row" onClick={() => setSelectedStock(s.ticker)}
                    style={{ background: '#FBF9F4', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleWatch(s.ticker); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: watchlist.has(s.ticker) ? '#C77B3F' : '#D4CCBC' }}>
                        <Bookmark size={15} fill={watchlist.has(s.ticker) ? '#C77B3F' : 'none'} />
                      </button>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="serif" style={{ fontWeight: 600, fontSize: 15 }}>{s.ticker}</span>
                          <span style={{ fontSize: 11, color: '#8A8270', background: '#EFEAE0', padding: '1px 7px', borderRadius: 4 }}>{s.sector}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600, color: mc.color, background: mc.bg, padding: '1px 7px', borderRadius: 4 }}>
                            <mc.icon size={10} /> {mc.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#8A8270', marginTop: 1 }}>
                          {s.name} · last mentioned {s.daysSinceLastMention === 0 ? 'today' : s.daysSinceLastMention + 'd ago'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                      <div style={{ width: 100, color: '#B0A78F' }}>
                        <MentionTimeline histogram={s.histogram} compact />
                      </div>
                      <div style={{ width: 80, textAlign: 'right' }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{s.mentions7d}</span>
                        <span style={{ fontSize: 11, color: '#8A8270' }}> / wk</span>
                        {s.mentionsPrev7d > 0 && (
                          <div style={{ fontSize: 10.5, color: s.mentions7d >= s.mentionsPrev7d ? '#3F7D58' : '#B04A3F' }}>
                            vs {s.mentionsPrev7d} last wk
                          </div>
                        )}
                      </div>
                      <div style={{ width: 130 }}>
                        <ConsensusBar buy={s.buy} hold={s.hold} sell={s.sell} />
                        <div style={{ fontSize: 10.5, color: '#8A8270', marginTop: 4 }}>{s.buy}B · {s.hold}H · {s.sell}C</div>
                      </div>
                      <div style={{ width: 60, textAlign: 'right' }}>
                        <div style={{ fontWeight: 500 }}>${s.price.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: s.change >= 0 ? '#3F7D58' : '#B04A3F', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                          {s.change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(s.change)}%
                        </div>
                      </div>
                      <ChevronRight size={16} color="#C4BBA8" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === 'stocks' && selectedStock && (() => {
          const s = stockSummaries.find(x => x.ticker === selectedStock);
          const mc = momentumConfig[s.momentum];
          const recentFirst = [...s.all].reverse();
          return (
            <div>
              <button onClick={() => setSelectedStock(null)} style={{ background: 'none', border: 'none', color: '#8A8270', fontSize: 12.5, cursor: 'pointer', marginBottom: 18, fontFamily: 'inherit' }}>
                ← back to all stocks
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, position: 'relative' }}>
                    <button onClick={() => openExplainer(s.ticker)}
                      style={{ display: 'flex', alignItems: 'baseline', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                      <span className="serif" style={{ fontSize: 32, fontWeight: 600, borderBottom: '2px dotted #C4BBA8', lineHeight: 1.15 }}>{s.ticker}</span>
                      <Info size={16} color="#A89F8C" style={{ marginBottom: 4 }} />
                    </button>
                    <span style={{ fontSize: 14, color: '#8A8270' }}>{s.name}</span>

                    {hasSeenHint && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 10px)', left: 0, zIndex: 20,
                        background: '#1F1B16', color: '#F7F4EE', fontSize: 12, padding: '8px 12px', borderRadius: 8,
                        display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', animation: 'fadeIn .3s ease',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                      }}>
                        <span>👆 Tap the ticker to see what this company actually does</span>
                        <button onClick={(e) => { e.stopPropagation(); setHasSeenHint(false); }}
                          style={{ background: 'none', border: 'none', color: '#A89F8C', cursor: 'pointer', padding: 0, display: 'flex' }}>
                          <X size={13} />
                        </button>
                        <div style={{ position: 'absolute', top: -5, left: 24, width: 10, height: 10, background: '#1F1B16', transform: 'rotate(45deg)' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#8A8270', background: '#EFEAE0', padding: '2px 8px', borderRadius: 4 }}>{s.sector}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: mc.color, background: mc.bg, padding: '2px 8px', borderRadius: 4 }}>
                      <mc.icon size={11} /> {mc.label}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="serif" style={{ fontSize: 26, fontWeight: 600 }}>${s.price.toLocaleString()}</div>
                  <div style={{ fontSize: 12.5, color: s.change >= 0 ? '#3F7D58' : '#B04A3F' }}>{s.change >= 0 ? '+' : ''}{s.change}% today</div>
                </div>
              </div>

              {/* 30-day mention timeline, full size */}
              <div style={{ background: '#FBF9F4', border: '1px solid #DDD5C4', borderRadius: 10, padding: 18, margin: '20px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A8270' }}>30-day mention pattern</div>
                  <div style={{ fontSize: 12, color: '#8A8270' }}>
                    <strong style={{ color: '#1F1B16' }}>{s.mentions7d}</strong> this week vs <strong style={{ color: '#1F1B16' }}>{s.mentionsPrev7d}</strong> the week before
                  </div>
                </div>
                <MentionTimeline histogram={s.histogram} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#B0A78F', marginTop: 6 }}>
                  <span>30 days ago</span><span>today</span>
                </div>
                {s.momentum === 'heating' && (
                  <p style={{ fontSize: 12.5, color: '#B05C44', marginTop: 12, lineHeight: 1.5 }}>
                    🔥 {s.uniqueYoutubers7d} different channels picked this up in the last 7 days — more activity than the prior week. Worth checking what changed.
                  </p>
                )}
                {s.momentum === 'cooling' && (
                  <p style={{ fontSize: 12.5, color: '#5C7A9E', marginTop: 12, lineHeight: 1.5 }}>
                    ❄️ Last mentioned {s.daysSinceLastMention} days ago — was more active two weeks ago. Coverage has quieted down.
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div style={{ background: stanceConfig.buy.bg, borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: stanceConfig.buy.color }} className="serif">{s.buy}</div>
                  <div style={{ fontSize: 11.5, color: stanceConfig.buy.color }}>say BUY (7d)</div>
                </div>
                <div style={{ background: stanceConfig.hold.bg, borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: stanceConfig.hold.color }} className="serif">{s.hold}</div>
                  <div style={{ fontSize: 11.5, color: stanceConfig.hold.color }}>say HOLD (7d)</div>
                </div>
                <div style={{ background: stanceConfig.sell.bg, borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: stanceConfig.sell.color }} className="serif">{s.sell}</div>
                  <div style={{ fontSize: 11.5, color: stanceConfig.sell.color }}>say OVERPRICED (7d)</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A8270' }}>
                  Full mention history, most recent first
                </span>
                <span style={{ fontSize: 10, color: '#A89F8C', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>— opinions, not advice</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentFirst.map((c, i) => {
                  const yt = ytById[c.yt];
                  const cfg = stanceConfig[c.stance];
                  const ds = daysSince(c.date);
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: 14, background: '#FBF9F4', border: '1px solid #DDD5C4', borderRadius: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: yt.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }} className="serif">{yt.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontWeight: 500, fontSize: 13 }}>{yt.name}</span>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#A89F8C' }}>{ds === 0 ? 'today' : ds + 'd ago'}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 4 }}>{cfg.label}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: '#5C5546', lineHeight: 1.5 }}>{c.point}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <a href="#" onClick={(e) => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#8A8270', marginTop: 20, textDecoration: 'none' }}>
                View full news on Yahoo Finance <ExternalLink size={12} />
              </a>
            </div>
          );
        })()}

        {view === 'youtubers' && !selectedYt && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {youtubers.map(y => {
              const picks = mentionLog.filter(m => m.yt === y.id && daysSince(m.date) <= 6);
              return (
                <div key={y.id} className="hover-row" onClick={() => setSelectedYt(y.id)}
                  style={{ background: '#FBF9F4', border: '1px solid #DDD5C4', borderRadius: 10, padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: y.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }} className="serif">{y.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }} className="serif">{y.name}</div>
                    <div style={{ fontSize: 12, color: '#8A8270' }}>{y.subs} subscribers · {picks.length} stocks this week</div>
                  </div>
                  <ChevronRight size={16} color="#C4BBA8" />
                </div>
              );
            })}
          </div>
        )}

        {view === 'youtubers' && selectedYt && (() => {
          const y = ytById[selectedYt];
          const picks = mentionLog.filter(m => m.yt === selectedYt).sort((a, b) => new Date(b.date) - new Date(a.date));
          return (
            <div>
              <button onClick={() => setSelectedYt(null)} style={{ background: 'none', border: 'none', color: '#8A8270', fontSize: 12.5, cursor: 'pointer', marginBottom: 18, fontFamily: 'inherit' }}>← back to all YouTubers</button>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 24 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: y.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 15 }} className="serif">{y.avatar}</div>
                <div>
                  <div className="serif" style={{ fontSize: 22, fontWeight: 600 }}>{y.name}</div>
                  <div style={{ fontSize: 12.5, color: '#8A8270' }}>{y.subs} subscribers · mention history</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {picks.map((m, i) => {
                  const cfg = stanceConfig[m.stance];
                  const ds = daysSince(m.date);
                  return (
                    <div key={i} style={{ display: 'flex', gap: 14, padding: 14, background: '#FBF9F4', border: '1px solid #DDD5C4', borderRadius: 10, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span className="serif" style={{ fontWeight: 600, fontSize: 14.5 }}>{m.stock}</span>
                          <span style={{ fontSize: 11, color: '#A89F8C' }}>{ds === 0 ? 'today' : ds + 'd ago'}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '1px 8px', borderRadius: 4, marginLeft: 'auto' }}>{cfg.label}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#5C5546', lineHeight: 1.5 }}>{m.point}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {view === 'watchlist' && (
          <div>
            {watchlist.size === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A8270' }}>
                <Bookmark size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
                <p style={{ fontSize: 14 }}>No stocks watched yet. Tap the bookmark icon on any stock to track its mention pattern here.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#8A8270', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {watchlist.size} stock{watchlist.size === 1 ? '' : 's'} tracked
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11.5, color: '#8A8270' }}>Sort by</span>
                    <div style={{ display: 'flex', gap: 2, background: '#EFEAE0', borderRadius: 8, padding: 3 }}>
                      {[
                        { id: 'popularity', label: 'Popularity' },
                        { id: 'momentum', label: 'Momentum' },
                        { id: 'conviction', label: 'Conviction' },
                        { id: 'alpha', label: 'A–Z' },
                      ].map(opt => (
                        <button key={opt.id} onClick={() => setWatchlistSort(opt.id)}
                          style={{ padding: '6px 10px', fontSize: 11.5, border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                            background: watchlistSort === opt.id ? '#FBF9F4' : 'transparent', color: watchlistSort === opt.id ? '#1F1B16' : '#8A8270' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sortedWatchlist.map(s => {
                    const mc = momentumConfig[s.momentum];
                    const isExpanded = expandedWatch.has(s.ticker);
                    const topYoutuber = [...s.last7].reduce((acc, m) => {
                      acc[m.yt] = (acc[m.yt] || 0) + 1;
                      return acc;
                    }, {});
                    const mostActiveId = Object.keys(topYoutuber).sort((a, b) => topYoutuber[b] - topYoutuber[a])[0];

                    return (
                      <div key={s.ticker} style={{ background: '#FBF9F4', border: '1px solid #DDD5C4', borderRadius: 10, overflow: 'hidden' }}>
                        <div className="hover-row" onClick={() => toggleExpand(s.ticker)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="serif" style={{ fontWeight: 600, fontSize: 15 }}>{s.ticker}</span>
                            <span style={{ fontSize: 12.5, color: '#8A8270' }}>{s.name}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600, color: mc.color, background: mc.bg, padding: '1px 7px', borderRadius: 4 }}>
                              <mc.icon size={10} /> {mc.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                            <div style={{ fontSize: 11.5, color: '#8A8270' }}>
                              <strong style={{ color: '#1F1B16', fontSize: 13 }}>{s.mentions7d}</strong> mentions / wk
                            </div>
                            <MentionTimeline histogram={s.histogram} compact />
                            <ConsensusBar buy={s.buy} hold={s.hold} sell={s.sell} />
                            <button onClick={(e) => { e.stopPropagation(); toggleWatch(s.ticker); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#C77B3F' }}>
                              <Bookmark size={15} fill="#C77B3F" />
                            </button>
                            <ChevronRight size={16} color="#C4BBA8" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{ padding: '0 16px 18px', borderTop: '1px solid #EFEAE0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16, marginBottom: 16 }}>
                              <div style={{ background: '#F2EEE4', borderRadius: 8, padding: '10px 12px' }}>
                                <div style={{ fontSize: 10.5, color: '#8A8270', marginBottom: 2 }}>Popularity (7d)</div>
                                <div className="serif" style={{ fontSize: 17, fontWeight: 600 }}>{s.mentions7d} mentions</div>
                                <div style={{ fontSize: 10.5, color: s.mentions7d >= s.mentionsPrev7d ? '#3F7D58' : '#B04A3F' }}>
                                  {s.mentions7d >= s.mentionsPrev7d ? '+' : ''}{s.mentions7d - s.mentionsPrev7d} vs prior week
                                </div>
                              </div>
                              <div style={{ background: '#F2EEE4', borderRadius: 8, padding: '10px 12px' }}>
                                <div style={{ fontSize: 10.5, color: '#8A8270', marginBottom: 2 }}>Unique channels</div>
                                <div className="serif" style={{ fontSize: 17, fontWeight: 600 }}>{s.uniqueYoutubers7d} of {youtubers.length}</div>
                                <div style={{ fontSize: 10.5, color: '#8A8270' }}>covering it this week</div>
                              </div>
                              <div style={{ background: '#F2EEE4', borderRadius: 8, padding: '10px 12px' }}>
                                <div style={{ fontSize: 10.5, color: '#8A8270', marginBottom: 2 }}>Net conviction</div>
                                <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: (s.buy - s.sell) >= 0 ? '#3F7D58' : '#B04A3F' }}>
                                  {s.buy - s.sell >= 0 ? '+' : ''}{s.buy - s.sell}
                                </div>
                                <div style={{ fontSize: 10.5, color: '#8A8270' }}>{s.buy} buy − {s.sell} caution</div>
                              </div>
                              <div style={{ background: '#F2EEE4', borderRadius: 8, padding: '10px 12px' }}>
                                <div style={{ fontSize: 10.5, color: '#8A8270', marginBottom: 2 }}>Last mentioned</div>
                                <div className="serif" style={{ fontSize: 17, fontWeight: 600 }}>
                                  {s.daysSinceLastMention === 0 ? 'Today' : `${s.daysSinceLastMention}d ago`}
                                </div>
                                {mostActiveId && <div style={{ fontSize: 10.5, color: '#8A8270' }}>most active: {ytById[mostActiveId].name}</div>}
                              </div>
                            </div>

                            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A8270', marginBottom: 8 }}>
                              Recent calls
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {[...s.all].reverse().slice(0, 3).map((c, i) => {
                                const yt = ytById[c.yt];
                                const cfg = stanceConfig[c.stance];
                                const ds = daysSince(c.date);
                                return (
                                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', background: '#FFFEFB', border: '1px solid #EFEAE0', borderRadius: 8 }}>
                                    <div style={{ width: 26, height: 26, borderRadius: 6, background: yt.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 600, flexShrink: 0 }} className="serif">{yt.avatar}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                                        <span style={{ fontSize: 12, fontWeight: 500 }}>{yt.name}</span>
                                        <span style={{ fontSize: 10.5, color: '#A89F8C' }}>{ds === 0 ? 'today' : ds + 'd ago'}</span>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '1px 6px', borderRadius: 4, marginLeft: 'auto' }}>{cfg.label}</span>
                                      </div>
                                      <p style={{ fontSize: 12, color: '#5C5546', lineHeight: 1.4 }}>{c.point}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <button onClick={() => { setView('stocks'); setSelectedStock(s.ticker); }}
                              style={{ marginTop: 12, fontSize: 12, color: '#1F1B16', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                              View full history <ChevronRight size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== LEADERBOARD VIEW ===== */}
        {view === 'leaderboard' && (() => {
          const boards = { week: leaderboardWeek, month: leaderboardMonth, year: leaderboardYear };
          const board = boards[leaderboardPeriod];
          const medalColors = ['#C9A24B', '#A8A8A0', '#B0793F'];
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span className="serif" style={{ fontSize: 22, fontWeight: 600 }}>Top YouTubers</span>
                <div style={{ display: 'flex', gap: 2, background: '#EFEAE0', borderRadius: 8, padding: 3 }}>
                  {[{ id: 'week', label: 'This week' }, { id: 'month', label: 'This month' }, { id: 'year', label: 'This year' }].map(opt => (
                    <button key={opt.id} onClick={() => setLeaderboardPeriod(opt.id)}
                      style={{ padding: '6px 12px', fontSize: 11.5, border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                        background: leaderboardPeriod === opt.id ? '#FBF9F4' : 'transparent', color: leaderboardPeriod === opt.id ? '#1F1B16' : '#8A8270' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: '#8A8270', marginBottom: 20 }}>
                Ranked by activity — how often a channel posts stock picks and how many different stocks they cover. An accuracy-based ranking is coming once we have enough price history after each call.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {board.map((y, i) => (
                  <div key={y.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    background: i < 3 ? '#FBF9F4' : '#FBF9F4', border: i === 0 ? '1px solid #D9C088' : '1px solid #DDD5C4', borderRadius: 10,
                  }}>
                    <div style={{ width: 26, display: 'flex', justifyContent: 'center' }}>
                      {i < 3 ? <Medal size={18} color={medalColors[i]} fill={medalColors[i]} /> : <span className="serif" style={{ fontSize: 13, color: '#C4BBA8', fontWeight: 600 }}>{i + 1}</span>}
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: 9, background: y.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 11.5, flexShrink: 0 }} className="serif">{y.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }} className="serif">{y.name}</div>
                      <div style={{ fontSize: 11.5, color: '#8A8270' }}>{y.subs} subscribers</div>
                    </div>
                    <div style={{ textAlign: 'right', width: 90 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{y.mentionCount}</div>
                      <div style={{ fontSize: 10.5, color: '#8A8270' }}>stock calls</div>
                    </div>
                    <div style={{ textAlign: 'right', width: 90 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{y.stocksCovered}</div>
                      <div style={{ fontSize: 10.5, color: '#8A8270' }}>unique stocks</div>
                    </div>
                    <button onClick={() => { setView('youtubers'); setSelectedYt(y.id); }}
                      style={{ background: 'none', border: '1px solid #DDD5C4', borderRadius: 7, padding: '6px 12px', fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit', color: '#5C5546' }}>
                      View calls
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ===== SUBMIT A CHANNEL VIEW ===== */}
        {view === 'submit' && (
          <div style={{ maxWidth: 520 }}>
            <span className="serif" style={{ fontSize: 22, fontWeight: 600 }}>Suggest a channel</span>
            <p style={{ fontSize: 13, color: '#8A8270', marginTop: 6, marginBottom: 24, lineHeight: 1.6 }}>
              Run a channel that covers stock picks, or know one we're missing? Tell us about it. We review every submission manually before adding a channel to the daily scan.
            </p>

            {submitted ? (
              <div style={{ background: '#E8F2EA', border: '1px solid #C9DECF', borderRadius: 10, padding: 18, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#3F7D58" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#3F7D58', marginBottom: 3 }}>Thanks — we've got it</div>
                  <p style={{ fontSize: 12.5, color: '#4D7359', lineHeight: 1.5 }}>We'll review the channel and let you know if it's added to the daily scan.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, color: '#8A8270', display: 'block', marginBottom: 6 }}>Channel name</label>
                  <input value={submitForm.channel} onChange={e => setSubmitForm({ ...submitForm, channel: e.target.value })}
                    placeholder="e.g. Market Tape Alex"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #DDD5C4', borderRadius: 8, background: '#FFFEFB', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: '#8A8270', display: 'block', marginBottom: 6 }}>YouTube URL</label>
                  <input value={submitForm.url} onChange={e => setSubmitForm({ ...submitForm, url: e.target.value })}
                    placeholder="https://youtube.com/@channelname"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #DDD5C4', borderRadius: 8, background: '#FFFEFB', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: '#8A8270', display: 'block', marginBottom: 6 }}>Why should we add it? (optional)</label>
                  <textarea value={submitForm.reason} onChange={e => setSubmitForm({ ...submitForm, reason: e.target.value })}
                    placeholder="e.g. Posts daily options conviction calls, very active on small caps..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #DDD5C4', borderRadius: 8, background: '#FFFEFB', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
                </div>
                <button onClick={() => submitForm.channel && submitForm.url && setSubmitted(true)}
                  disabled={!submitForm.channel || !submitForm.url}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '11px', background: (submitForm.channel && submitForm.url) ? '#1F1B16' : '#D4CCBC',
                    color: '#F7F4EE', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    cursor: (submitForm.channel && submitForm.url) ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                  }}>
                  <Send size={14} /> Submit for review
                </button>
              </div>
            )}

            <p style={{ fontSize: 11, color: '#A89F8C', marginTop: 20, lineHeight: 1.5 }}>
              Are you the creator of a channel? We don't pay for inclusion and inclusion isn't guaranteed — we prioritize channels with consistent, ticker-specific stock calls.
            </p>
          </div>
        )}
      </div>

      {/* ===== ELI10 EXPLAINER SIDEBAR ===== */}
      {explainerOpen && explainerTicker && (() => {
        const ex = explainers[explainerTicker];
        const meta = stockMeta[explainerTicker];
        if (!ex) return null;
        return (
          <>
            <div onClick={() => setExplainerOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(31,27,22,0.4)', zIndex: 90, animation: 'fadeIn .2s ease' }} />
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(420px, 92vw)', background: '#FBF9F4',
              zIndex: 91, boxShadow: '-8px 0 30px rgba(0,0,0,0.12)', overflowY: 'auto',
              animation: 'slideInRight .25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #DDD5C4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#FBF9F4', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={16} color="#8A8270" />
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A8270' }}>What is this company?</span>
                </div>
                <button onClick={() => setExplainerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8270', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                  <span className="serif" style={{ fontSize: 26, fontWeight: 600 }}>{explainerTicker}</span>
                  <span style={{ fontSize: 13, color: '#8A8270' }}>{meta?.name}</span>
                </div>
                <span style={{ fontSize: 11, color: '#8A8270', background: '#EFEAE0', padding: '2px 8px', borderRadius: 4 }}>{meta?.sector}</span>

                <div style={{ marginTop: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#B05C44', marginBottom: 6 }}>What it does</div>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: '#1F1B16' }}>{ex.what}</p>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#B05C44', marginBottom: 6 }}>Why it's in demand right now</div>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: '#1F1B16' }}>{ex.why}</p>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#B05C44', marginBottom: 6 }}>Backstory</div>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: '#1F1B16' }}>{ex.backstory}</p>
                </div>

                {ex.related && ex.related.length > 0 && (
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #DDD5C4' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A8270', marginBottom: 10 }}>
                      <Link2 size={12} /> Where it fits in the stack
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {ex.related.map(r => (
                        <button key={r.ticker} onClick={() => { setExplainerTicker(r.ticker); }}
                          style={{ display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', padding: '10px 12px', background: '#F2EEE4', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                          <span className="serif" style={{ fontWeight: 600, fontSize: 13, flexShrink: 0, color: '#1F1B16' }}>{r.ticker}</span>
                          <span style={{ fontSize: 12.5, color: '#5C5546', lineHeight: 1.5 }}>{r.note}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => { setExplainerOpen(false); setView('stocks'); setSelectedStock(explainerTicker); }}
                  style={{ marginTop: 24, width: '100%', padding: '11px', background: '#1F1B16', color: '#F7F4EE', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  See today's YouTuber consensus <ChevronRight size={14} />
                </button>

                <p style={{ fontSize: 10.5, color: '#A89F8C', marginTop: 14, lineHeight: 1.5, textAlign: 'center' }}>
                  Background info, not investment analysis — written for context, not advice.
                </p>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
