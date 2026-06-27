'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 text-ink-muted hover:text-ink transition-colors text-left"
      >
        <span className="text-[13px] uppercase tracking-widest">How this works</span>
        <ChevronDown
          size={12}
          className="transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div className="mt-3 pl-3 border-l-2 border-parchment-border">
          <div className="grid grid-cols-3 gap-5">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-ink-faint mb-1">What we do</div>
              <p className="text-[13px] text-ink-muted leading-relaxed">
                We scan a curated list of finance YouTube channels daily. Every video is transcribed and every stock call — buy, hold, or sell — is extracted and logged.
              </p>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-ink-faint mb-1">What you see</div>
              <p className="text-[13px] text-ink-muted leading-relaxed">
                Each row is a stock. The consensus bar shows buy / hold / sell calls in the last 7 days. The momentum badge shows whether coverage is picking up or slowing down.
              </p>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-ink-faint mb-1">What we don&apos;t do</div>
              <p className="text-[13px] text-ink-muted leading-relaxed">
                We don&apos;t make our own calls. We don&apos;t weight channels by subscribers. This is a summary of public YouTuber opinions — nothing more.
              </p>
            </div>
          </div>
          <div className="mt-3 text-[12px] text-ink-faint">
            Questions? See our <Link href="/faq" className="text-ink-muted underline hover:text-ink">full FAQ</Link>.
          </div>
        </div>
      )}
    </div>
  );
}
