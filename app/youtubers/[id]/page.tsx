import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getYoutuberWithMentions, getYoutubers } from '@/lib/data';
import YoutuberDetailView from './YoutuberDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getYoutuberWithMentions(id);
  if (!result) return {};
  return {
    title: `${result.youtuber.channel_name} — Stock Call History`,
    description: `All stock calls from ${result.youtuber.channel_name}, most recent first.`,
  };
}

export async function generateStaticParams() {
  const youtubers = await getYoutubers();
  return youtubers.map(y => ({ id: y.id }));
}

export default async function YoutuberPage({ params }: Props) {
  const { id } = await params;
  const result = await getYoutuberWithMentions(id);
  if (!result) notFound();
  return <YoutuberDetailView youtuber={result.youtuber} mentions={result.mentions} />;
}
