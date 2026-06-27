import { AlertCircle } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="bg-parchment border-t border-parchment-border py-1 px-6">
      <div className="max-w-[1140px] mx-auto flex items-center gap-1.5 text-[11px] text-ink-muted">
        <AlertCircle size={10} className="shrink-0" />
        <span>
          This page summarizes public YouTuber opinions. It is not financial advice — always do your own research.
        </span>
      </div>
    </div>
  );
}
