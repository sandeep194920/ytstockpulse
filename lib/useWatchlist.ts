'use client';

import { useState, useEffect } from 'react';

const KEY = 'ytsp_watchlist_v1';

function load(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set(['NVDA', 'OKLO']);
  } catch {
    return new Set(['NVDA', 'OKLO']);
  }
}

function save(s: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {}
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  // Load from localStorage after hydration
  useEffect(() => {
    setWatchlist(load());
  }, []);

  function toggle(ticker: string) {
    setWatchlist(prev => {
      const next = new Set(prev);
      next.has(ticker) ? next.delete(ticker) : next.add(ticker);
      save(next);
      return next;
    });
  }

  return { watchlist, toggle };
}
