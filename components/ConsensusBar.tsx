'use client';

interface Props {
  buy: number;
  hold: number;
  sell: number;
  showTrapWarning?: boolean;
}

export default function ConsensusBar({ buy, hold, sell, showTrapWarning }: Props) {
  const total = buy + hold + sell || 1;
  const bp = (buy / total) * 100;
  const hp = (hold / total) * 100;
  const sp = (sell / total) * 100;
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center gap-1.5">
        <div className="flex h-1.5 rounded-full overflow-hidden flex-1 bg-parchment-muted">
          <div style={{ width: `${bp}%` }} className="bg-buy" />
          <div style={{ width: `${hp}%` }} className="bg-hold" />
          <div style={{ width: `${sp}%` }} className="bg-sell" />
        </div>
        {showTrapWarning && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-warn-bg text-warn border border-warn-border shrink-0"
            title="When all tracked channels agree, the thesis may already be priced in — not a confidence signal."
          >
            [!]
          </span>
        )}
      </div>
      <div className="text-[11px] text-ink-faint">
        {buy}B · {hold}H · {sell}C
      </div>
    </div>
  );
}
