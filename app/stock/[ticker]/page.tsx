import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStockSummary, getYoutubers, getExplainer } from '@/lib/data';
import { STOCKS_BY_TICKER } from '@/lib/mock-data';
import StockDetailView from './StockDetailView';

interface Props {
  params: Promise<{ ticker: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  const upper = ticker.toUpperCase();
  const summary = await getStockSummary(upper);
  if (!summary) return {};

  const { buy_7d, hold_7d, sell_7d, name } = summary;
  const total = buy_7d + hold_7d + sell_7d;
  const desc = total > 0
    ? `${buy_7d} buy · ${hold_7d} hold · ${sell_7d} overpriced — ${total} YouTuber mentions this week. Not financial advice.`
    : `Track finance YouTuber consensus on ${name}. Not financial advice.`;

  return {
    title: `${upper} — Today's YouTuber Consensus`,
    description: desc,
    alternates: { canonical: `/stock/${ticker.toLowerCase()}` },
  };
}

export function generateStaticParams() {
  return Object.keys(STOCKS_BY_TICKER).map(ticker => ({
    ticker: ticker.toLowerCase(),
  }));
}

export default async function StockPage({ params }: Props) {
  const { ticker } = await params;
  const [summary, youtubers, explainer] = await Promise.all([
    getStockSummary(ticker.toUpperCase()),
    getYoutubers(),
    getExplainer(ticker.toUpperCase()),
  ]);
  if (!summary) notFound();
  return <StockDetailView summary={summary} youtubers={youtubers} explainer={explainer} />;
}
