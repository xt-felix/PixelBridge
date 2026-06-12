import { NextRequest, NextResponse } from 'next/server';
import { saveBridgeData } from '@/lib/bridge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shop, cart_token, fbp, fbc, gclid, ttclid, axwrt, ua, url, referrer } = body;

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop' }, { status: 400 });
    }

    await saveBridgeData(shop, cart_token || '', {
      fbp, fbc, gclid, ttclid, axwrt, ua,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
      url, referrer,
      timestamp: Date.now(),
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[pixel/bridge]', err);
    return new NextResponse(null, { status: 204 });
  }
}

export const runtime = 'nodejs';
