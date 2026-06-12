import { NextRequest, NextResponse } from 'next/server';
import { getShopSession } from '@/lib/shop-config';

export async function POST(req: NextRequest) {
  try {
    const { shop } = await req.json();
    if (!shop) {
      return NextResponse.json({ error: 'Missing shop' }, { status: 400 });
    }

    const session = await getShopSession(shop);
    if (!session) {
      return NextResponse.json({ error: 'Shop not authenticated' }, { status: 401 });
    }

    const appUrl = process.env.SHOPLINE_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
    const scriptSrc = `${appUrl}/pixelbridge.js?shop=${shop}&server=${appUrl}`;

    const res = await fetch(
      `https://${shop}.myshopline.com/admin/openapi/v20250601/store/script_tags.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script_tag: {
            event: 'onload',
            src: scriptSrc,
            display_scope: 'all',
          },
        }),
      }
    );

    const data = await res.json();
    return NextResponse.json({ success: true, scriptTag: data });
  } catch (err) {
    console.error('[scripttag]', err);
    return NextResponse.json({ error: 'Failed to inject script' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
