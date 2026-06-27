'use client';

import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = ' ytsp_disclaimer_v1';

export default function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-ink/55 z-[100] flex items-center justify-center p-5" style={{ animation: 'fadeIn .2s ease' }}>
      <div
        className="bg-parchment-card rounded-2xl p-7 max-w-[440px] w-full border border-parchment-border"
        style={{ animation: 'slideUp .25s ease' }}
      >
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-9 h-9 rounded-[10px] bg-parchment-deep flex items-center justify-center shrink-0">
            <AlertCircle size={18} color="#B05C44" />
          </div>
          <span className="font-serif text-lg font-semibold">Before you dive in</span>
        </div>
        <p className="text-[13.5px] leading-relaxed text-ink-mid mb-2.5">
          <strong>ytstockpulse is not financial advice.</strong> Everything here is a summary of opinions expressed publicly by YouTube creators — not analysis from licensed financial advisors, and not a recommendation from us.
        </p>
        <p className="text-[13.5px] leading-relaxed text-ink-mid mb-5">
          YouTubers can be wrong, biased, or paid to promote a stock without disclosure. Use this as a starting point for your own research, not a substitute for it.
        </p>
        <button
          onClick={accept}
          className="w-full py-3 bg-ink text-parchment rounded-lg text-[13px] font-medium cursor-pointer font-mono"
        >
          I understand, take me in
        </button>
      </div>
    </div>
  );
}
