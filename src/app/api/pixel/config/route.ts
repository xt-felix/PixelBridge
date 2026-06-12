import { NextRequest, NextResponse } from 'next/server';
import { getShopConfig, saveShopConfig, ShopConfig } from '@/lib/shop-config';

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('shop');
  if (!shop) {
    return NextResponse.json({ error: 'Missing shop' }, { status: 400 });
  }

  const config = await getShopConfig(shop);
  return NextResponse.json(config || { shop, meta: null, google: null, tiktok: null, applovin: null });
}

export async function POST(req: NextRequest) {
  try {
    const body: ShopConfig = await req.json();
    if (!body.shop) {
      return NextResponse.json({ error: 'Missing shop' }, { status: 400 });
    }
    await saveShopConfig(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[pixel/config]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
