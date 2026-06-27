import type { Metadata } from 'next';
import SubmitChannelForm from '@/components/SubmitChannelForm';

export const metadata: Metadata = {
  title: 'Suggest a Channel',
  description: 'Know a finance YouTuber who makes specific stock picks daily? Tell us about them.',
};

export default function SubmitPage() {
  return (
    <div className="max-w-[520px]">
      <h1 className="font-serif text-[22px] font-semibold text-ink">Suggest a channel</h1>
      <p className="text-[13.5px] text-ink-muted mt-1.5 mb-6 leading-relaxed">
        Run a channel that covers stock picks, or know one we&apos;re missing? Tell us about it. We review every
        submission manually before adding a channel to the daily scan.
      </p>

      <SubmitChannelForm />

      <p className="text-[13.5px] text-ink-faint mt-5 leading-relaxed">
        Are you the creator of a channel? We don&apos;t pay for inclusion and inclusion isn&apos;t guaranteed — we
        prioritize channels with consistent, ticker-specific stock calls.
      </p>
    </div>
  );
}
