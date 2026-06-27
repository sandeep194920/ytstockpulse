'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, Users, Trophy, Bookmark, Send, HelpCircle, Sun, Moon } from 'lucide-react';
import DisclaimerBanner from './DisclaimerBanner';

const TABS = [
  { href: '/', label: 'By stock', Icon: BarChart3 },
  { href: '/youtubers', label: 'By YouTuber', Icon: Users },
  { href: '/leaderboard', label: 'Leaderboard', Icon: Trophy },
  { href: '/watchlist', label: 'Watchlist', Icon: Bookmark },
  { href: '/faq', label: 'FAQ', Icon: HelpCircle },
  { href: '/submit', label: 'Suggest a channel', Icon: Send },
];

export default function NavBar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/' || pathname.startsWith('/stock');
    return pathname.startsWith(href);
  }

  return (
    <header className="border-b border-parchment-border bg-parchment-card sticky top-0 z-10">
      <div className="max-w-[1140px] mx-auto px-6 pt-3 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-2.5">
            <Link href="/" className="font-serif text-[22px] font-semibold tracking-tight text-ink no-underline">
              ytstockpulse
            </Link>
            <span className="text-[11px] text-ink-muted uppercase tracking-widest">daily consensus, 2-minute read</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-parchment-hover transition-colors"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        <nav className="flex gap-0.5">
          {TABS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium rounded-md mb-2 no-underline transition-colors"
                style={{
                  background: active ? 'var(--color-ink)' : 'transparent',
                  color: active ? 'var(--color-parchment)' : 'var(--color-ink-muted)',
                }}
              >
                <Icon size={12} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <DisclaimerBanner />
    </header>
  );
}
