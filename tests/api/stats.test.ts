import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStore = new Map<string, unknown>();
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn((key: string) => mockStore.get(key) || null),
    set: vi.fn((key: string, value: unknown) => { mockStore.set(key, value); }),
    del: vi.fn((...keys: string[]) => { keys.forEach(k => mockStore.delete(k)); }),
  },
}));

import { POST, OPTIONS } from '@/app/api/stats/route';
import { getShopStats } from '@/lib/shop';
import { NextRequest } from 'next/server';

function createStatsRequest(shop: string | null, body: object | string): NextRequest {
  const url = shop
    ? `https://example.com/api/stats?shop=${shop}`
    : 'https://example.com/api/stats';
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('stats route', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('returns 400 when shop param is missing', async () => {
    const req = createStatsRequest(null, { pv: 1 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('https://example.com/api/stats?shop=myshop', {
      method: 'POST',
      body: 'not-json{{{',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 204 and increments stats on valid request', async () => {
    const req = createStatsRequest('myshop', { pv: 5, atc: 2, gmv: 99.99 });
    const res = await POST(req);
    expect(res.status).toBe(204);

    const stats = await getShopStats('myshop');
    expect(stats!.pv).toBe(5);
    expect(stats!.atc).toBe(2);
    expect(stats!.gmv).toBe(99.99);
  });

  it('accumulates stats from multiple requests', async () => {
    await POST(createStatsRequest('myshop', { pv: 3 }));
    await POST(createStatsRequest('myshop', { pv: 7, pc: 1 }));

    const stats = await getShopStats('myshop');
    expect(stats!.pv).toBe(10);
    expect(stats!.pc).toBe(1);
  });

  it('handles empty body fields gracefully', async () => {
    const req = createStatsRequest('myshop', {});
    const res = await POST(req);
    expect(res.status).toBe(204);

    const stats = await getShopStats('myshop');
    expect(stats!.pv).toBe(0);
    expect(stats!.atc).toBe(0);
  });

  it('OPTIONS returns CORS headers', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-allow-methods')).toBe('POST, OPTIONS');
    expect(res.headers.get('access-control-allow-headers')).toBe('Content-Type');
  });
});
