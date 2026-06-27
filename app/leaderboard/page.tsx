import type { Metadata } from 'next';
import { getLeaderboard, getFirstMovers } from '@/lib/data';
import LeaderboardView from './LeaderboardView';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'Top finance YouTubers ranked by activity, first-mover rate, and (coming soon) track record.',
};

export default async function LeaderboardPage() {
  const [week, month, year, firstMovers] = await Promise.all([
    getLeaderboard('week'),
    getLeaderboard('month'),
    getLeaderboard('year'),
    getFirstMovers(),
  ]);
  return <LeaderboardView week={week} month={month} year={year} firstMovers={firstMovers} />;
}
