'use client';

import Link from 'next/link';
import { Play, Flag } from 'lucide-react';
import YoutuberAvatar from '@/components/YoutuberAvatar';
import StanceChip from '@/components/StanceChip';
import { buildTimestampUrl, formatTimestamp } from '@/lib/youtube';
import { archetypeFromSlug, archetypeColor, archetypeDescription } from '@/lib/archetypes';
import type { Youtuber, Mention } from '@/lib/types';

interface Props {
  youtuber: Youtuber;
  mentions: Mention[];
}

export default function YoutuberDetailView({ youtuber: y, mentions }: Props) {
  const archetype = archetypeFromSlug(y.archetype);
  const firstMoverCount = mentions.filter(m => m.is_first_tracked_mention).length;
  const firstMoverTickers = mentions.filter(m => m.is_first_tracked_mention).map(m => m.stock_ticker);

  return (
    <div>
      <Link href="/youtubers" className="text-ink-muted text-[11px] mb-4 inline-block no-underline hover:text-ink">
        ← back to all YouTubers
      </Link>

      <div className="flex gap-3.5 items-start mb-6">
        <YoutuberAvatar initials={y.avatar_initials} color={y.avatar_color} avatarUrl={y.avatar_url} size={52} />
        <div className="flex-1">
          <div className="font-serif text-[22px] font-semibold text-ink">{y.channel_name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-ink-muted">
              {(y.subscriber_count / 1000).toFixed(0)}K subscribers
            </span>
            {archetype && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: archetypeColor(archetype) + '22', color: archetypeColor(archetype) }}
              >
                {archetype}
              </span>
            )}
          </div>
          {archetype && (
            <p className="text-[13px] text-ink-muted mt-1">{archetypeDescription(archetype)}</p>
          )}
          {firstMoverCount > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-[13px] text-ink-mid bg-parchment-deep border border-parchment-border rounded-lg px-2.5 py-1.5 w-fit">
              <Flag size={12} className="text-ink-muted" />
              <span>
                Called <strong>{firstMoverCount} stock{firstMoverCount > 1 ? 's' : ''}</strong> before any other tracked channel
                {firstMoverTickers.length > 0 && (
                  <span className="text-ink-muted"> ({firstMoverTickers.join(', ')})</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {mentions.map(m => {
          const days = Math.round(
            (new Date('2026-06-20').getTime() - new Date(m.mentioned_at).getTime()) / 86400000
          );
          const timestampUrl = buildTimestampUrl(m.video_url, m.video_timestamp_seconds);
          return (
            <div
              key={m.id}
              className="flex gap-3.5 p-3.5 bg-parchment-card border border-parchment-border rounded-xl items-start"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/stock/${m.stock_ticker.toLowerCase()}`}
                    className="font-serif font-semibold text-[11px] text-ink no-underline hover:underline"
                  >
                    {m.stock_ticker}
                  </Link>
                  {m.is_first_tracked_mention && (
                    <span className="flex items-center gap-0.5 text-[10.5px] text-ink-muted bg-parchment-muted px-1.5 py-0.5 rounded">
                      <Flag size={9} />
                      First here
                    </span>
                  )}
                  <span className="text-[11px] text-ink-faint">{days === 0 ? 'today' : `${days}d ago`}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {m.video_timestamp_seconds != null ? (
                      <a
                        href={timestampUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink no-underline"
                        title="Jump to this moment in the video"
                      >
                        <Play size={10} />
                        {formatTimestamp(m.video_timestamp_seconds)}
                      </a>
                    ) : (
                      <a
                        href={m.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink no-underline"
                        title="Watch video"
                      >
                        <Play size={10} />
                        Watch
                      </a>
                    )}
                    <StanceChip stance={m.stance} />
                  </div>
                </div>
                <p className="text-[13.5px] text-ink-mid leading-relaxed">{m.reasoning}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
