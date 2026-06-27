'use client';

interface Props {
  histogram: number[]; // 30 entries: index 0 = 29d ago, index 29 = today
  compact?: boolean;
}

export default function MentionTimeline({ histogram, compact = false }: Props) {
  const max = Math.max(...histogram, 1);
  const h = compact ? 24 : 44;

  return (
    <div className="flex items-end" style={{ gap: compact ? 1.5 : 2.5, height: h }}>
      {histogram.map((v, i) => {
        const dayOffset = 29 - i;
        const isToday = dayOffset === 0;
        const barH = v === 0 ? 2 : Math.max(4, (v / max) * h);
        const label = dayOffset === 0 ? 'today' : `${dayOffset}d ago`;
        return (
          <div
            key={i}
            title={`${v} mention${v === 1 ? '' : 's'} · ${label}`}
            style={{
              width: compact ? 3 : 5,
              height: barH,
              borderRadius: 1.5,
              background: v === 0
                ? 'var(--color-parchment-border)'
                : isToday
                ? 'var(--color-ink)'
                : 'var(--color-ink-faint)',
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}
