import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'How ytstockpulse works — channel selection, methodology, what the signals mean, and what this site is not.',
};

const FAQS = [
  {
    q: 'What is ytstockpulse?',
    a: 'A daily aggregator of stock opinions from finance YouTube channels. We scan each channel\'s videos, extract every specific stock call (buy, hold, or sell), and show you the aggregated picture — so you can see what the YouTube finance world is saying about a stock in 2 minutes instead of watching 10 videos.',
  },
  {
    q: 'How are channels selected?',
    a: 'We manually curate and vet every channel before adding it. The bar: the channel must make specific, ticker-level calls ("buy NVDA") — not generic financial education. It must post consistently (at least weekly). We deliberately include a mix of styles: value investors, momentum traders, macro-focused channels. A channel with a smaller audience but consistent, specific calls beats a large channel that only talks in generalities.',
  },
  {
    q: 'Can I suggest a channel?',
    a: 'Yes — use the Suggest a channel form. Every submission is reviewed manually. We don\'t pay for inclusion and inclusion isn\'t guaranteed.',
  },
  {
    q: 'What do buy / hold / sell mean here?',
    a: '"Buy" means the YouTuber expressed a positive, actionable view on the stock in that video. "Hold" means they acknowledged owning it or watching it but aren\'t adding. "Overpriced" (shown as sell in the data) means they explicitly said the current price is too high or they\'re reducing. These are extracted from what the creator said — we don\'t reclassify or editorialize.',
  },
  {
    q: 'What does the momentum badge mean?',
    a: '"Heating up" means more channels mentioned this stock in the last 7 days than the 7 days before that. "Cooling down" means the opposite — coverage is slowing. "Steady" means roughly the same level of coverage week over week. It\'s purely a measure of mention volume, not price direction.',
  },
  {
    q: 'What does the [!] marker on the consensus bar mean?',
    a: 'It means all or nearly all tracked channels that mentioned this stock this week said the same thing. We surface it so you\'re aware the view is unanimous — not to tell you what to make of that. Read the individual calls and decide for yourself.',
  },
  {
    q: 'What does "split verdict" mean?',
    a: 'When a stock has both 2+ buy calls and 2+ sell calls in the same 7-day window, we flag it as a split verdict. Channels that often trend the same direction are suddenly disagreeing — which usually means new information is in play. Worth reading all the individual calls rather than relying on the consensus bar.',
  },
  {
    q: 'What does "First here" mean on a mention card?',
    a: 'It means this channel was the first among all channels we track to publicly mention this stock. It\'s a signal of who tends to find stories early vs. who covers them once they\'re already widely discussed.',
  },
  {
    q: 'How often is the data updated?',
    a: 'The pipeline runs daily. New videos published by tracked channels are picked up within 24 hours.',
  },
  {
    q: 'Are the YouTubers paid to appear here?',
    a: 'No. Channels are selected purely on the quality and specificity of their stock coverage. We don\'t accept payment for inclusion, and paid placement will never affect the underlying mention or consensus data.',
  },
  {
    q: 'Is this financial advice?',
    a: 'No. This site summarizes opinions expressed by YouTubers in their public videos. It is not financial advice. We are not registered advisors. Nothing here should be the sole basis for any investment decision. Always do your own research.',
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-[680px]">
      <Link href="/" className="text-ink-faint text-[12px] mb-5 inline-block no-underline hover:text-ink-muted">
        ← back to stocks
      </Link>

      <h1 className="font-serif text-[26px] font-semibold text-ink mb-1">Frequently asked questions</h1>
      <p className="text-[13.5px] text-ink-muted mb-8">
        How the product works, what the signals mean, and what this site is not.
      </p>

      <div className="flex flex-col gap-0 divide-y divide-parchment-border border border-parchment-border rounded-xl overflow-hidden">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="px-5 py-4 bg-parchment-card">
            <div className="font-medium text-[14px] text-ink mb-1.5">{q}</div>
            <p className="text-[13.5px] text-ink-mid leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      <p className="text-[13.5px] text-ink-muted mt-6 leading-relaxed">
        Still have a question?{' '}
        <Link href="/submit" className="text-ink underline">Suggest a channel</Link>
        {' '}or reach out directly — contact info coming soon.
      </p>
    </div>
  );
}
