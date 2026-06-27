import type { Metadata } from 'next';
import { getAllStockSummaries } from '@/lib/data';
import WatchlistView from './WatchlistView';

export const metadata: Metadata = {
  title: 'Watchlist',
  description: 'Your tracked stocks, sorted by popularity, momentum, conviction, or alphabetically.',
};

export default async function WatchlistPage() {
  const summaries = await getAllStockSummaries();
  return <WatchlistView allSummaries={summaries} />;
}
