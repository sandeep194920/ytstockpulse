export function buildTimestampUrl(videoUrl: string, seconds: number | null): string {
  if (!seconds || seconds <= 0) return videoUrl;
  try {
    const url = new URL(videoUrl);
    url.searchParams.set('t', String(Math.floor(seconds)));
    return url.toString();
  } catch {
    return videoUrl;
  }
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function priceSinceCall(priceAtCall: number | null, currentPrice: number | undefined): number | null {
  if (!priceAtCall || !currentPrice || priceAtCall <= 0) return null;
  return Math.round(((currentPrice - priceAtCall) / priceAtCall) * 1000) / 10; // one decimal
}
