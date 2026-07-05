import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, createScriptTag, registerWebhook } from '@/lib/shopline-api';
import { saveShopToken, saveShopSubscription } from '@/lib/shop';
import { createTrialSubscription } from '@/lib/subscription';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || '';
  const shop = req.nextUrl.searchParams.get('handle') || req.nextUrl.searchParams.get('shop') || '';

  if (!code || !shop) {
    return NextResponse.json({ error: 'Missing code or shop' }, { status: 400 });
  }

  const accessToken = await exchangeCodeForToken(shop, code);
  if (!accessToken) {
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
  }

  await saveShopToken(shop, { accessToken, shopDomain: `${shop}.myshopline.com` });

  const appUrl = process.env.SHOPLINE_APP_URL!;
  const pixelSrc = `${appUrl}/api/pixel/${shop}`;
  await createScriptTag(shop, accessToken, pixelSrc);

  await registerWebhook(shop, accessToken, 'app/uninstalled', `${appUrl}/api/webhook`);

  await saveShopSubscription(shop, createTrialSubscription());

  return NextResponse.redirect(`${appUrl}/dashboard?shop=${shop}`);
}
