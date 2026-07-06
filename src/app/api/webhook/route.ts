import { NextRequest, NextResponse } from 'next/server';
import { saveShopSubscription, deleteShopData } from '@/lib/shop';
import { type ShopSubscription } from '@/lib/shop';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const topic = req.headers.get('x-shopline-topic') || '';
  const shopDomain = req.headers.get('x-shopline-shop-domain') || '';
  const shopId = shopDomain.replace('.myshopline.com', '') || body.handle || '';

  if (!shopId) {
    return NextResponse.json({ error: 'Unknown shop' }, { status: 400 });
  }

  switch (topic) {
    case 'app/uninstalled': {
      await deleteShopData(shopId);
      break;
    }

    case 'appsubscription/create': {
      const pkg = body.subPackage;
      if (pkg) {
        const sub: ShopSubscription = {
          status: pkg.trial ? 'trial' : 'active',
          startAt: pkg.startAt || Date.now(),
          endAt: pkg.endAt || 0,
          spuKey: pkg.spuKey || '',
          autoRenew: pkg.autoRenewStatus || false,
        };
        await saveShopSubscription(shopId, sub);
      }
      break;
    }

    case 'appsubscription/expired': {
      await saveShopSubscription(shopId, {
        status: 'expired',
        startAt: 0,
        endAt: 0,
      });
      break;
    }

    case 'appsubscription/payment_finalized': {
      const pkg = body.subPackage;
      if (pkg) {
        const sub: ShopSubscription = {
          status: 'active',
          startAt: pkg.startAt || Date.now(),
          endAt: pkg.endAt || 0,
          spuKey: pkg.spuKey || '',
          autoRenew: pkg.autoRenewStatus || false,
        };
        await saveShopSubscription(shopId, sub);
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
