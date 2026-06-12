import { NextRequest, NextResponse } from 'next/server';
import { saveShopSession, getShopSession } from '@/lib/shop-config';

// Debug endpoint to manually set shop session token
// DELETE THIS IN PRODUCTION
export async function POST(req: NextRequest) {
  try {
    const { shop, accessToken, secret } = await req.json();

    if (secret !== process.env.SHOPLINE_APP_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!shop || !accessToken) {
      return NextResponse.json({ error: 'Missing shop or accessToken' }, { status: 400 });
    }

    await saveShopSession(shop, accessToken);
    return NextResponse.json({ success: true, shop });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('shop') || '';
  const session = await getShopSession(shop);
  return NextResponse.json({ hasSession: !!session, shop });
}

export const runtime = 'nodejs';
