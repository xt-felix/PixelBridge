import { NextRequest, NextResponse } from 'next/server';
import { saveShopSubscription } from '@/lib/shop';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const topic = req.headers.get('x-shopline-topic') || '';
  const shopDomain = req.headers.get('x-shopline-shop-domain') || '';
  const shopId = shopDomain.replace('.myshopline.com', '');

  if (!shopId) {
    return NextResponse.json({ error: 'Unknown shop' }, { status: 400 });
  }

  if (topic === 'app/uninstalled') {
    await saveShopSubscription(shopId, { status: 'cancelled', trialEnd: 0 });
  }

  return NextResponse.json({ ok: true });
}
