import { NextRequest, NextResponse } from 'next/server';
import { saveShopSession } from '@/lib/shop-config';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || '';
  const handle = req.nextUrl.searchParams.get('handle') || req.nextUrl.searchParams.get('shop') || '';

  if (!code || !handle) {
    return NextResponse.json({ error: 'Missing code or handle' }, { status: 400 });
  }

  const tokenRes = await fetch(`https://${handle}.myshopline.com/admin/oauth/token/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      appKey: process.env.SHOPLINE_APP_KEY,
      appSecret: process.env.SHOPLINE_APP_SECRET,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.token) {
    console.error('[auth] token exchange failed:', tokenData);
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
  }

  await saveShopSession(handle, tokenData.token);

  // Register webhooks
  const webhookTopics = ['order/paid-successfully', 'apps/installed_uninstalled'];
  for (const topic of webhookTopics) {
    await fetch(`https://${handle}.myshopline.com/admin/openapi/v20250601/webhooks.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic,
          address: `${process.env.SHOPLINE_APP_URL}/api/webhook`,
          format: 'json',
        },
      }),
    }).catch(e => console.error(`[auth] webhook register failed: ${topic}`, e.message));
  }

  return NextResponse.redirect(`${process.env.SHOPLINE_APP_URL}/dashboard?shop=${handle}`);
}

export const runtime = 'nodejs';
