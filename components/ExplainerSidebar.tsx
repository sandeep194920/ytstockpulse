'use client';

import { X, BookOpen, Link2, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ExplainerContent } from '@/lib/types';

interface Props {
  initialTicker: string;
  initialExplainer: ExplainerContent;
  onClose: () => void;
}

export default function ExplainerSidebar({ initialTicker, initialExplainer, onClose }: Props) {
  const [ticker, setTicker] = useState(initialTicker);
  const [ex, setEx] = useState<ExplainerContent>(initialExplainer);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function switchTicker(newTicker: string) {
    setLoading(true);
    setTicker(newTicker);
    try {
      const res = await fetch(`/api/explainer/${newTicker}`);
      if (res.ok) {
        const data = await res.json();
        setEx(data);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!ex) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[90]"
        style={{ background: 'rgba(31,27,22,0.4)', animation: 'fadeIn .2s ease' }}
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 bottom-0 bg-parchment-card z-[91] overflow-y-auto"
        style={{
          width: 'min(420px, 92vw)',
          boxShadow: '-8px 0 30px rgba(0,0,0,0.12)',
          animation: 'slideInRight .25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-parchment-border sticky top-0 bg-parchment-card z-10">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-ink-muted" />
            <span className="text-[11px] uppercase tracking-widest text-ink-muted">What is this company?</span>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-baseline gap-2.5 mb-4">
            <span className="font-serif text-[26px] font-semibold">{ticker}</span>
            {loading && <span className="text-[12px] text-ink-faint">Loading...</span>}
          </div>

          <section className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-heating mb-1.5">What it does</div>
            <p className="text-[13.5px] leading-relaxed text-ink">{ex.what}</p>
          </section>

          <section className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-heating mb-1.5">Why it's in demand right now</div>
            <p className="text-[13.5px] leading-relaxed text-ink">{ex.why}</p>
          </section>

          <section className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-heating mb-1.5">Backstory</div>
            <p className="text-[13.5px] leading-relaxed text-ink">{ex.backstory}</p>
          </section>

          {ex.related_tickers.length > 0 && (
            <div className="mt-6 pt-5 border-t border-parchment-border">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-muted mb-2.5">
                <Link2 size={12} />
                Where it fits in the stack
              </div>
              <div className="flex flex-col gap-2">
                {ex.related_tickers.map(r => (
                  <button
                    key={r.ticker}
                    onClick={() => switchTicker(r.ticker)}
                    className="flex gap-2.5 items-start text-left p-2.5 bg-parchment-deep rounded-lg w-full hover:bg-parchment-hover transition-colors"
                  >
                    <span className="font-serif font-semibold text-[14px] shrink-0 text-ink">{r.ticker}</span>
                    <span className="text-[13px] text-ink-mid leading-relaxed">{r.note}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              onClose();
              router.push(`/stock/${ticker.toLowerCase()}`);
            }}
            className="mt-6 w-full py-3 bg-ink text-parchment rounded-lg text-[13px] font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity font-mono"
          >
            See today's YouTuber consensus <ChevronRight size={14} />
          </button>

          <p className="text-[11px] text-ink-faint text-center mt-3.5 leading-relaxed">
            Background info, not investment analysis — written for context, not advice.
          </p>
        </div>
      </div>
    </>
  );
}
