import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveShopSession } from '@/lib/shop-config';

function createHmacSign(appSecret: string, message: string): string {
  return crypto.createHmac('sha256', appSecret).update(message).digest('hex');
}

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

  const appKey = process.env.SHOPLINE_APP_KEY!;
  const appSecret = process.env.SHOPLINE_APP_SECRET!;
  const timestamp = Date.now().toString();
  const originSignature = `${JSON.stringify({ code })}${timestamp}`;
  const sign = createHmacSign(appSecret, originSignature);

  const tokenUrl = `https://${handle}.myshopline.com/admin/oauth/token/create`;

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'appkey': appKey,
      'sign': sign,
      'timestamp': timestamp,
    },
    body: JSON.stringify({ code }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.data?.accessToken || tokenData.data?.access_token || tokenData.token || tokenData.access_token;

  if (!accessToken) {
    return NextResponse.json({
      error: 'Token exchange failed',
      handle,
      response: tokenData,
    }, { status: 500 });
  }

  await saveShopSession(handle, accessToken);

  // Inject ScriptTag immediately
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
          address: `${appUrl}/api/webhook`,
          format: 'json',
        },
      }),
    }).catch(() => {});
  }

  return NextResponse.redirect(`${appUrl}/dashboard?shop=${handle}`);
}

export const runtime = 'nodejs';
