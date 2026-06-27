-- ============================================================
-- 002_seed_channels.sql
-- Seed the initial set of vetted finance YouTube channels.
-- All start as 'active' — manually reviewed before insertion.
-- ============================================================

insert into youtubers (channel_name, youtube_channel_id, subscriber_count, avatar_color, avatar_initials, archetype, status)
values
  (
    'Stealth Wealth Investing',
    '@stealthwealthinvesting',
    6200,
    '#5C7A5C',
    'SWI',
    'value-investor',
    'active'
  ),
  (
    'Parkev Tatevosian, CFA',
    '@parkevtatevosiancfa9544',
    873000,
    '#4A6E8E',
    'PT',
    'value-investor',
    'active'
  ),
  (
    'Ticker Symbol: YOU',
    '@TickerSymbolYOU',
    485000,
    '#7B5EA7',
    'TSY',
    'growth-investor',
    'active'
  ),
  (
    'Business With Brian',
    '@BusinessWithBrian',
    406000,
    '#C4763A',
    'BWB',
    'value-investor',
    'active'
  ),
  (
    'Tom Nash',
    '@TomNashTV',
    681000,
    '#3A7D7D',
    'TN',
    'growth-investor',
    'active'
  ),
  (
    'Rick Orford',
    '@RickOrford',
    83200,
    '#8E4A4A',
    'RO',
    'dividend-investor',
    'active'
  ),
  (
    'Investing Simplified - Professor G',
    '@NolanGouveia',
    448000,
    '#5C8A6E',
    'IG',
    'value-investor',
    'active'
  ),
  (
    'Jerry Romine Stocks',
    '@JerryRomineStocks',
    189000,
    '#7A6E3A',
    'JRS',
    'value-investor',
    'active'
  ),
  (
    'Fin Tek',
    '@FinTek',
    247000,
    '#4A5C8E',
    'FT',
    'growth-investor',
    'active'
  ),
  (
    'MarketBeat',
    '@MarketBeatMedia',
    30100,
    '#6E3A7A',
    'MB',
    'momentum-trader',
    'active'
  ),
  (
    'Everything Money',
    '@EverythingMoney',
    550000,
    '#C4913A',
    'EM',
    'value-investor',
    'active'
  ),
  (
    'Wall Street Zen',
    '@WallStreetZen',
    120000,
    '#3A7A5C',
    'WSZ',
    'value-investor',
    'active'
  ),
  (
    'Joseph Hogue - Let''s Talk Money',
    '@josephhogue',
    620000,
    '#7A3A5C',
    'JH',
    'dividend-investor',
    'active'
  )
on conflict (youtube_channel_id) do nothing;
