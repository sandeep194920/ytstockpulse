'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import YoutuberAvatar from '@/components/YoutuberAvatar';
import { archetypeFromSlug, archetypeColor } from '@/lib/archetypes';
import type { Youtuber } from '@/lib/types';

interface YoutuberWithCount extends Youtuber {
  picksThisWeek: number;
}

interface Props {
  youtubers: YoutuberWithCount[];
}

export default function YoutubersView({ youtubers }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3.5">
      {youtubers.map(y => {
        const archetype = archetypeFromSlug(y.archetype);
        return (
          <Link
            key={y.id}
            href={`/youtubers/${y.id}`}
            className="bg-parchment-card border border-parchment-border rounded-xl p-4 flex gap-3.5 items-center no-underline hover:bg-parchment-hover transition-colors"
          >
            <YoutuberAvatar initials={y.avatar_initials} color={y.avatar_color} avatarUrl={y.avatar_url} size={46} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="font-serif font-semibold text-[14px] text-ink truncate">{y.channel_name}</div>
                {archetype && (
                  <span
                    className="text-[10.5px] px-1.5 py-0.5 rounded font-medium shrink-0"
                    style={{ background: archetypeColor(archetype) + '1A', color: archetypeColor(archetype) }}
                  >
                    {archetype}
                  </span>
                )}
              </div>
              <div className="text-[12px] text-ink-muted">
                {(y.subscriber_count / 1000).toFixed(0)}K subscribers · {y.picksThisWeek} {y.picksThisWeek === 1 ? 'stock' : 'stocks'} this week
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-border shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
