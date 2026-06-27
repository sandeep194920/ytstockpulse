import type { Metadata } from 'next';
import { IBM_Plex_Mono, Fraunces } from 'next/font/google';
import './globals.css';
import NavBar from '@/components/NavBar';
import DisclaimerModal from '@/components/DisclaimerModal';

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fraunces',
});

export const metadata: Metadata = {
  title: {
    template: '%s | ytstockpulse',
    default: 'ytstockpulse — Daily YouTuber Stock Consensus',
  },
  description:
    'What finance YouTubers are saying about stocks today. Real-time consensus from 20+ curated channels — buy, hold, or overpriced. Not financial advice.',
  metadataBase: new URL('https://ytstockpulse.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} ${fraunces.variable}`}>
      <body className="font-mono min-h-screen bg-parchment">
        <DisclaimerModal />
        <NavBar />
        <main className="max-w-[1140px] mx-auto px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
