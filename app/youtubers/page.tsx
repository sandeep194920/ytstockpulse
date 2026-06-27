import type { Metadata } from 'next';
import { getYoutubers } from '@/lib/data';
import { supabaseAdmin } from '@/lib/supabase';
import YoutubersView from './YoutubersView';

export const metadata: Metadata = {
  title: 'By YouTuber',
  description: 'Browse all tracked finance YouTubers and their recent stock calls.',
};

export default async function YoutubersPage() {
  const youtubers = await getYoutubers();

  // Count picks per youtuber in the last 7 days
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: counts } = await supabaseAdmin
    .from('mentions')
    .select('youtuber_id')
    .gte('mentioned_at', since);

  const countMap: Record<string, number> = {};
  for (const m of counts ?? []) {
    countMap[m.youtuber_id] = (countMap[m.youtuber_id] ?? 0) + 1;
  }

  const withCounts = youtubers.map(y => ({
    ...y,
    picksThisWeek: countMap[y.id] ?? 0,
  }));

  return <YoutubersView youtubers={withCounts} />;
}
