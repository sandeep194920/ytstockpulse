'use client';

import { Flame, Snowflake, Zap } from 'lucide-react';
import type { Momentum } from '@/lib/types';

const CONFIG = {
  heating: { label: 'Heating up', Icon: Flame,     color: 'var(--color-heating)', bg: 'var(--color-heating-bg)' },
  cooling: { label: 'Going quiet', Icon: Snowflake, color: 'var(--color-cooling)', bg: 'var(--color-cooling-bg)' },
  steady:  { label: 'Steady',     Icon: Zap,       color: 'var(--color-ink-muted)', bg: 'var(--color-parchment-muted)' },
} as const;

interface Props {
  momentum: Momentum;
}

export default function MomentumBadge({ momentum }: Props) {
  const { label, Icon, color, bg } = CONFIG[momentum];
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1 py-px rounded"
      style={{ color, background: bg }}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}
