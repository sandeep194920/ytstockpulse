import { NextResponse } from 'next/server';
import { getExplainer } from '@/lib/data';

export async function GET(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const explainer = await getExplainer(ticker.toUpperCase());
  if (!explainer) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(explainer);
}
