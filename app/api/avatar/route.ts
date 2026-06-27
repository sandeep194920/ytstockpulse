import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url || !url.startsWith('https://yt3.ggpht.com/')) {
    return new NextResponse('Bad request', { status: 400 });
  }

  const res = await fetch(url);
  if (!res.ok) {
    return new NextResponse('Not found', { status: 404 });
  }

  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
