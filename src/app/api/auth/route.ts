import { NextRequest, NextResponse } from 'next/server';
import { buildOAuthUrl } from '@/lib/shopline-api';

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('shop') || '';
  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }
  return NextResponse.redirect(buildOAuthUrl(shop));
}
