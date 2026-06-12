import { NextRequest, NextResponse } from 'next/server';
import { saveShopSession } from '@/lib/shop-config';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || '';
  let handle = req.nextUrl.searchParams.get('handle') || req.nextUrl.searchParams.get('shop') || req.nextUrl.searchParams.get('store') || '';

  if (!handle) handle = 'pixelbridge-dev';

  if (!code) {
    return NextResponse.json({
      error: 'Missing code',
      params: Object.fromEntries(req.nextUrl.searchParams.entries()),
    }, { status: 400 });
  }

  // Try multiple token exchange formats
  const appKey = process.env.SHOPLINE_APP_KEY!;
  const appSecret = process.env.SHOPLINE_APP_SECRET!;
  const tokenUrl = `https://${handle}.myshopline.com/admin/oauth/token/create`;

  // Format 1: Shopline standard
  let tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      appKey,
      appSecret,
    }),
  });

  let tokenData = await tokenRes.json();

  // Format 2: try with snake_case if first attempt failed
  if (!tokenData.token && !tokenData.access_token) {
    tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        app_key: appKey,
        app_secret: appSecret,
        grant_type: 'authorization_code',
      }),
    });
    tokenData = await tokenRes.json();
  }

  const accessToken = tokenData.token || tokenData.access_token;

  if (!accessToken) {
    // Return detailed error for debugging
    return NextResponse.json({
      error: 'Token exchange failed',
      handle,
      code: code.substring(0, 10) + '...',
      response: tokenData,
      tokenUrl,
    }, { status: 500 });
  }

  await saveShopSession(handle, accessToken);

  // Register webhooks
  const webhookTopics = ['order/paid-successfully', 'apps/installed_uninstalled'];
  for (const topic of webhookTopics) {
    await fetch(`https://${handle}.myshopline.com/admin/openapi/v20250601/webhooks.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic,
          address: `${process.env.SHOPLINE_APP_URL}/api/webhook`,
          format: 'json',
        },
      }),
    }).catch(() => {});
  }

  // Also inject ScriptTag immediately after auth
  const appUrl = process.env.SHOPLINE_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  const scriptSrc = `${appUrl}/pixelbridge.js?shop=${handle}&server=${appUrl}`;
  await fetch(`https://${handle}.myshopline.com/admin/openapi/v20250601/store/script_tags.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      script_tag: {
        event: 'onload',
        src: scriptSrc,
        display_scope: 'all',
      },
    }),
  }).catch(() => {});

  return NextResponse.redirect(`${process.env.SHOPLINE_APP_URL}/dashboard?shop=${handle}`);
}

export const runtime = 'nodejs';
