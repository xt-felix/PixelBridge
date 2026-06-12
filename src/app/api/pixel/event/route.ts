import { NextRequest, NextResponse } from 'next/server';
import { getBridgeData } from '@/lib/bridge';
import { getShopConfig } from '@/lib/shop-config';
import { sendToMeta, sendToGoogle, sendToTikTok, sendToAppLovin, TrackEvent } from '@/lib/capi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, event_id, shop, data, attribution, ua, url, referrer, cart_token, timestamp } = body;

    if (!shop || !event) {
      return NextResponse.json({ error: 'Missing shop or event' }, { status: 400 });
    }

    const config = await getShopConfig(shop);
    if (!config) {
      return new NextResponse(null, { status: 204 });
    }

    const trackEvent: TrackEvent = {
      name: event,
      eventId: event_id,
      timestamp: timestamp || Date.now(),
      value: data?.value,
      currency: data?.currency,
      orderId: data?.order_id,
      productIds: data?.product_id ? [data.product_id] : undefined,
      quantity: data?.quantity,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
      ua: ua || req.headers.get('user-agent') || '',
      url: url || '',
      referrer: referrer || '',
      fbp: attribution?.fbp,
      fbc: attribution?.fbc,
      gclid: attribution?.gclid,
      ttclid: attribution?.ttclid,
      axwrt: attribution?.axwrt,
    };

    const bridgeData = await getBridgeData(shop, cart_token);

    const promises: Promise<any>[] = [];
    if (config.meta) {
      promises.push(sendToMeta(trackEvent, bridgeData, config.meta).catch(e => console.error('[Meta]', e.message)));
    }
    if (config.google && event === 'purchase') {
      promises.push(sendToGoogle(trackEvent, bridgeData, config.google).catch(e => console.error('[Google]', e.message)));
    }
    if (config.tiktok) {
      promises.push(sendToTikTok(trackEvent, bridgeData, config.tiktok).catch(e => console.error('[TikTok]', e.message)));
    }
    if (config.applovin) {
      promises.push(sendToAppLovin(trackEvent, bridgeData, config.applovin).catch(e => console.error('[AppLovin]', e.message)));
    }

    Promise.allSettled(promises);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[pixel/event]', err);
    return new NextResponse(null, { status: 204 });
  }
}

export const runtime = 'nodejs';
