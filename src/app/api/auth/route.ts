import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('handle') || req.nextUrl.searchParams.get('shop') || '';
  const appKey = process.env.SHOPLINE_APP_KEY!;
  const scopes = 'write_script_tags,read_orders,read_customers,read_checkouts,read_data_report';
  const redirectUri = `${process.env.SHOPLINE_APP_URL}/api/auth/callback`;

  const authUrl = `https://${shop}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${appKey}&responseType=code&scope=${scopes}&redirectUri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authUrl);
}

export const runtime = 'nodejs';
