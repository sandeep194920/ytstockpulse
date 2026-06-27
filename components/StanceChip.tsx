'use client';

import type { Stance } from '@/lib/types';

const CONFIG = {
  buy:  { label: 'Buy',       color: 'var(--color-buy)',  bg: 'var(--color-buy-bg)' },
  hold: { label: 'Hold',      color: 'var(--color-hold)', bg: 'var(--color-hold-bg)' },
  sell: { label: 'Overpriced', color: 'var(--color-sell)', bg: 'var(--color-sell-bg)' },
} as const;

interface Props {
  stance: Stance;
  size?: 'sm' | 'md';
}

export default function StanceChip({ stance, size = 'md' }: Props) {
  const { label, color, bg } = CONFIG[stance];
  const px = size === 'sm' ? '6px' : '8px';
  const fontSize = size === 'sm' ? 10 : 11;
  return (
    <span
      className="inline-block font-semibold rounded"
      style={{ color, background: bg, padding: `2px ${px}`, fontSize }}
    >
      {label}
    </span>
  );
}
