import { NextRequest, NextResponse } from 'next/server';
import { incrementShopStats } from '@/lib/shop';

export async function POST(req: NextRequest) {
  const shopId = req.nextUrl.searchParams.get('shop');
  if (!shopId) {
    return NextResponse.json({ error: 'Missing shop' }, { status: 400 });
  }

  let body: { pv?: number; atc?: number; bc?: number; pc?: number; gmv?: number };
  try {
    const text = await req.text();
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  await incrementShopStats(shopId, {
    pv: body.pv || 0,
    atc: body.atc || 0,
    bc: body.bc || 0,
    pc: body.pc || 0,
    gmv: body.gmv || 0,
  });

  return new NextResponse(null, { status: 204 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
