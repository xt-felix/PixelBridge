import { NextRequest, NextResponse } from 'next/server';
import { saveShopSubscription, getShopSubscription } from '@/lib/shop';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== 'pixelbridge2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const shopId = req.nextUrl.searchParams.get('shop') || '';
  const action = req.nextUrl.searchParams.get('action') || 'status';

  if (!shopId) {
    return NextResponse.json({ error: 'Missing shop' }, { status: 400 });
  }

  if (action === 'trial') {
    const now = Date.now();
    const end = now + 3 * 24 * 60 * 60 * 1000;
    await saveShopSubscription(shopId, { status: 'trial', startAt: now, endAt: end });
    return NextResponse.json({ ok: true, status: 'trial', endAt: new Date(end).toISOString() });
  }

  if (action === 'activate') {
    const now = Date.now();
    const end = now + 30 * 24 * 60 * 60 * 1000;
    await saveShopSubscription(shopId, { status: 'active', startAt: now, endAt: end });
    return NextResponse.json({ ok: true, status: 'active', endAt: new Date(end).toISOString() });
  }

  if (action === 'expire') {
    await saveShopSubscription(shopId, { status: 'expired', startAt: 0, endAt: 0 });
    return NextResponse.json({ ok: true, status: 'expired' });
  }

  const sub = await getShopSubscription(shopId);
  return NextResponse.json({ shop: shopId, subscription: sub });
}
