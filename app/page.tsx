import type { Metadata } from 'next';
import { getAllStockSummaries } from '@/lib/data';
import StocksView from './StocksView';

export const metadata: Metadata = {
  title: 'ytstockpulse — Daily YouTuber Stock Consensus',
  description:
    'What finance YouTubers are saying about stocks today. Daily consensus from 20+ curated channels — buy, hold, or overpriced. Not financial advice.',
};

export default async function HomePage() {
  const summaries = await getAllStockSummaries();
  return <StocksView summaries={summaries} />;
}
