'use client';

import { Send, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function SubmitChannelForm() {
  const [form, setForm] = useState({ channel: '', url: '', reason: '' });
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = form.channel.trim() && form.url.trim();

  if (submitted) {
    return (
      <div className="bg-buy-bg border border-buy rounded-xl p-4.5 flex gap-2.5 items-start" style={{ borderColor: 'var(--color-buy)' }}>
        <CheckCircle2 size={18} className="text-buy shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-[13.5px] text-buy mb-1">Thanks — we&apos;ve got it</div>
          <p className="text-[13px] text-buy leading-relaxed" style={{ opacity: 0.8 }}>
            We&apos;ll review the channel and let you know if it&apos;s added to the daily scan.
          </p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-3.5 py-2.5 border border-parchment-border rounded-lg bg-input-bg text-[13.5px] font-mono outline-none focus:border-ink-faint text-ink";

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <label className="block text-[13px] text-ink-muted mb-1.5">Channel name</label>
        <input
          value={form.channel}
          onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
          placeholder="e.g. Market Tape Alex"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-[13px] text-ink-muted mb-1.5">YouTube URL</label>
        <input
          value={form.url}
          onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
          placeholder="https://youtube.com/@channelname"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-[13px] text-ink-muted mb-1.5">Why should we add it? (optional)</label>
        <textarea
          value={form.reason}
          onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
          placeholder="e.g. Posts daily options conviction calls, very active on small caps..."
          rows={3}
          className={inputClass + ' resize-y'}
        />
      </div>
      <button
        onClick={() => canSubmit && setSubmitted(true)}
        disabled={!canSubmit}
        className="flex items-center justify-center gap-1.5 py-3 rounded-lg text-[13px] font-medium font-mono transition-colors"
        style={{
          background: canSubmit ? 'var(--color-ink)' : 'var(--color-parchment-border)',
          color: 'var(--color-parchment)',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        <Send size={14} /> Submit for review
      </button>
    </div>
  );
}
