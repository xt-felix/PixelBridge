import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStore = new Map<string, unknown>();
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn((key: string) => mockStore.get(key) || null),
    set: vi.fn((key: string, value: unknown) => { mockStore.set(key, value); }),
    del: vi.fn((...keys: string[]) => { keys.forEach(k => mockStore.delete(k)); }),
  },
}));

import { POST } from '@/app/api/webhook/route';
import { getShopSubscription } from '@/lib/shop';
import { NextRequest } from 'next/server';

function createWebhookRequest(topic: string, shopDomain: string, body: object): NextRequest {
  return new NextRequest('https://example.com/api/webhook', {
    method: 'POST',
    headers: {
      'x-shopline-topic': topic,
      'x-shopline-shop-domain': shopDomain,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('webhook route', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('returns 400 when shop cannot be determined', async () => {
    const req = createWebhookRequest('appsubscription/create', '', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('handles appsubscription/create with trial', async () => {
    const now = Date.now();
    const end = now + 259200000;
    const req = createWebhookRequest('appsubscription/create', 'myshop.myshopline.com', {
      subPackage: {
        trial: true,
        startAt: now,
        endAt: end,
        spuKey: 'pro',
        autoRenewStatus: true,
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const sub = await getShopSubscription('myshop');
    expect(sub).not.toBeNull();
    expect(sub!.status).toBe('trial');
    expect(sub!.startAt).toBe(now);
    expect(sub!.endAt).toBe(end);
    expect(sub!.spuKey).toBe('pro');
    expect(sub!.autoRenew).toBe(true);
  });

  it('handles appsubscription/create with paid subscription', async () => {
    const now = Date.now();
    const end = now + 30 * 24 * 60 * 60 * 1000;
    const req = createWebhookRequest('appsubscription/create', 'paidshop.myshopline.com', {
      subPackage: {
        trial: false,
        startAt: now,
        endAt: end,
        spuKey: 'pro',
        autoRenewStatus: true,
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const sub = await getShopSubscription('paidshop');
    expect(sub!.status).toBe('active');
    expect(sub!.endAt).toBe(end);
  });

  it('handles appsubscription/expired', async () => {
    mockStore.set('shop:expshop:sub', JSON.stringify({ status: 'trial', startAt: 1000, endAt: 2000 }));

    const req = createWebhookRequest('appsubscription/expired', 'expshop.myshopline.com', {});
    const res = await POST(req);
    expect(res.status).toBe(200);

    const sub = await getShopSubscription('expshop');
    expect(sub!.status).toBe('expired');
    expect(sub!.endAt).toBe(0);
  });

  it('handles appsubscription/payment_finalized', async () => {
    const now = Date.now();
    const end = now + 30 * 24 * 60 * 60 * 1000;
    const req = createWebhookRequest('appsubscription/payment_finalized', 'payshop.myshopline.com', {
      subPackage: {
        startAt: now,
        endAt: end,
        spuKey: 'pro',
        autoRenewStatus: true,
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const sub = await getShopSubscription('payshop');
    expect(sub!.status).toBe('active');
    expect(sub!.endAt).toBe(end);
  });

  it('handles app/uninstalled by deleting all shop data', async () => {
    mockStore.set('shop:delshop:config', JSON.stringify({ pixelKey: 'k', categoryId: 1 }));
    mockStore.set('shop:delshop:sub', JSON.stringify({ status: 'active', startAt: 0, endAt: 0 }));
    mockStore.set('shop:delshop:token', JSON.stringify({ accessToken: 'tok', shopDomain: 'd' }));
    mockStore.set('shop:delshop:stats', JSON.stringify({ pv: 10, atc: 0, bc: 0, pc: 0, gmv: 0, lastSeen: 0 }));

    const req = createWebhookRequest('app/uninstalled', 'delshop.myshopline.com', {});
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockStore.has('shop:delshop:config')).toBe(false);
    expect(mockStore.has('shop:delshop:sub')).toBe(false);
    expect(mockStore.has('shop:delshop:token')).toBe(false);
    expect(mockStore.has('shop:delshop:stats')).toBe(false);
  });

  it('handles unknown topic gracefully', async () => {
    const req = createWebhookRequest('unknown/event', 'shop.myshopline.com', {});
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('extracts shopId from body.handle when header is empty', async () => {
    const now = Date.now();
    const req = new NextRequest('https://example.com/api/webhook', {
      method: 'POST',
      headers: {
        'x-shopline-topic': 'appsubscription/expired',
        'x-shopline-shop-domain': '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ handle: 'fallbackshop' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const sub = await getShopSubscription('fallbackshop');
    expect(sub!.status).toBe('expired');
  });

  it('handles appsubscription/create without subPackage', async () => {
    const req = createWebhookRequest('appsubscription/create', 'nopkg.myshopline.com', {});
    const res = await POST(req);
    expect(res.status).toBe(200);

    const sub = await getShopSubscription('nopkg');
    expect(sub).toBeNull();
  });
});
