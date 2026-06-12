import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getBridgeData } from '@/lib/bridge';
import { getShopConfig } from '@/lib/shop-config';
import { sendToMeta, sendToGoogle, sendToTikTok, sendToAppLovin, TrackEvent } from '@/lib/capi';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const hmac = req.headers.get('x-shopline-hmac-sha256') || '';

    const expectedHmac = crypto
      .createHmac('sha256', process.env.SHOPLINE_APP_SECRET!)
      .update(rawBody)
      .digest('base64');

    if (hmac !== expectedHmac) {
      console.error('[webhook] HMAC verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topic = req.headers.get('x-shopline-topic') || '';
    const shopDomain = req.headers.get('x-shopline-shop-domain') || '';
    const payload = JSON.parse(rawBody);

    console.log(`[webhook] ${topic} from ${shopDomain}`);

    switch (topic) {
      case 'order/paid-successfully':
        await handleOrderPaid(payload, shopDomain);
        break;
      case 'apps/installed_uninstalled':
        console.log('[webhook] app uninstalled:', shopDomain);
        break;
      case 'customers/redact':
        console.log('[webhook] customers/redact');
        break;
      case 'merchants/redact':
        console.log('[webhook] merchants/redact');
        break;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[webhook] error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

async function handleOrderPaid(order: any, shopDomain: string) {
  const shop = shopDomain.replace('.myshopline.com', '');
  const config = await getShopConfig(shop);
  if (!config) {
    console.log(`[webhook] no config for shop: ${shop}`);
    return;
  }

  const bridgeData = await getBridgeData(shop, order.cart_token || '');

  const event: TrackEvent = {
    name: 'purchase',
    eventId: order.id || order.order_id || `order_${Date.now()}`,
    orderId: order.id || order.order_id,
    timestamp: Date.now(),
    value: parseFloat(order.total_price || '0'),
    currency: order.currency || 'USD',
    email: order.email,
    phone: order.phone || order.billing_address?.phone,
    firstName: order.billing_address?.first_name || order.customer?.first_name,
    lastName: order.billing_address?.last_name || order.customer?.last_name,
    city: order.billing_address?.city,
    state: order.billing_address?.province,
    zip: order.billing_address?.zip,
    country: order.billing_address?.country,
    customerId: order.customer?.id?.toString(),
    productIds: order.line_items?.map((item: any) => item.product_id?.toString()),
    quantity: order.line_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0),
    ip: order.browser_ip || bridgeData?.ip || '',
    ua: bridgeData?.ua || '',
    url: bridgeData?.url || '',
    fbp: bridgeData?.fbp,
    fbc: bridgeData?.fbc,
    gclid: bridgeData?.gclid,
    ttclid: bridgeData?.ttclid,
    axwrt: bridgeData?.axwrt,
  };

  console.log(`[webhook] purchase: ${shop}, order: ${event.orderId}, value: ${event.value} ${event.currency}, bridge: ${bridgeData ? 'YES' : 'NO'}`);

  const results = await Promise.allSettled([
    config.meta ? sendToMeta(event, bridgeData, config.meta) : null,
    config.google ? sendToGoogle(event, bridgeData, config.google) : null,
    config.tiktok ? sendToTikTok(event, bridgeData, config.tiktok) : null,
    config.applovin ? sendToAppLovin(event, bridgeData, config.applovin) : null,
  ].filter(Boolean) as Promise<any>[]);

  const platforms = ['Meta', 'Google', 'TikTok', 'AppLovin'];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') console.log(`[webhook] ${platforms[i]} OK`);
    else console.error(`[webhook] ${platforms[i]} FAIL:`, (r as PromiseRejectedResult).reason?.message);
  });
}

export const runtime = 'nodejs';
