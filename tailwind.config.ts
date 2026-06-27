import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
        serif: ['var(--font-fraunces)', 'serif'],
      },
      colors: {
        parchment: {
          DEFAULT: 'var(--color-parchment)',
          card: 'var(--color-parchment-card)',
          hover: 'var(--color-parchment-hover)',
          border: 'var(--color-parchment-border)',
          muted: 'var(--color-parchment-muted)',
          deep: 'var(--color-parchment-deep)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          mid: 'var(--color-ink-mid)',
          muted: 'var(--color-ink-muted)',
          faint: 'var(--color-ink-faint)',
          border: 'var(--color-ink-border)',
        },
        buy: { DEFAULT: 'var(--color-buy)', bg: 'var(--color-buy-bg)' },
        hold: { DEFAULT: 'var(--color-hold)', bg: 'var(--color-hold-bg)' },
        sell: { DEFAULT: 'var(--color-sell)', bg: 'var(--color-sell-bg)' },
        heating: { DEFAULT: 'var(--color-heating)', bg: 'var(--color-heating-bg)' },
        cooling: { DEFAULT: 'var(--color-cooling)', bg: 'var(--color-cooling-bg)' },
        warn: { DEFAULT: 'var(--color-warn)', bg: 'var(--color-warn-bg)', border: 'var(--color-warn-border)' },
        input: { bg: 'var(--color-input-bg)' },
      },
    },
  },
  plugins: [],
};

export default config;
