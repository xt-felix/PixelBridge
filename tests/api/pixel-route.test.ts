import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStore = new Map<string, unknown>();
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn((key: string) => mockStore.get(key) || null),
    set: vi.fn((key: string, value: unknown) => { mockStore.set(key, value); }),
    del: vi.fn((...keys: string[]) => { keys.forEach(k => mockStore.delete(k)); }),
  },
}));

vi.stubEnv('SHOPLINE_APP_URL', 'https://pixel-bridge-seven.vercel.app');

import { GET } from '@/app/api/pixel/[shopId]/route';
import { NextRequest } from 'next/server';

function createPixelRequest(shopId: string): [NextRequest, { params: Promise<{ shopId: string }> }] {
  const req = new NextRequest(`https://example.com/api/pixel/${shopId}`);
  return [req, { params: Promise.resolve({ shopId }) }];
}

describe('pixel route', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('returns "// inactive" when no subscription exists', async () => {
    const [req, ctx] = createPixelRequest('noshop');
    const res = await GET(req, ctx);
    const text = await res.text();
    expect(text).toBe('// inactive');
    expect(res.headers.get('content-type')).toBe('application/javascript');
  });

  it('returns "// inactive" when subscription is expired', async () => {
    mockStore.set('shop:expshop:sub', { status: 'expired', startAt: 0, endAt: 0 });
    const [req, ctx] = createPixelRequest('expshop');
    const res = await GET(req, ctx);
    const text = await res.text();
    expect(text).toBe('// inactive');
  });

  it('returns "// inactive" when trial has passed endAt', async () => {
    mockStore.set('shop:oldtrial:sub', { status: 'trial', startAt: Date.now() - 500000, endAt: Date.now() - 1000 });
    const [req, ctx] = createPixelRequest('oldtrial');
    const res = await GET(req, ctx);
    const text = await res.text();
    expect(text).toBe('// inactive');
  });

  it('returns "// not configured" when active but no config', async () => {
    mockStore.set('shop:noconfig:sub', { status: 'trial', startAt: Date.now(), endAt: Date.now() + 100000 });
    const [req, ctx] = createPixelRequest('noconfig');
    const res = await GET(req, ctx);
    const text = await res.text();
    expect(text).toBe('// not configured');
  });

  it('returns "// not configured" when config has empty pixelKey', async () => {
    mockStore.set('shop:emptykey:sub', { status: 'active', startAt: Date.now(), endAt: Date.now() + 100000 });
    mockStore.set('shop:emptykey:config', { pixelKey: '', categoryId: 166 });
    const [req, ctx] = createPixelRequest('emptykey');
    const res = await GET(req, ctx);
    const text = await res.text();
    expect(text).toBe('// not configured');
  });

  it('returns full pixel script when active and configured', async () => {
    mockStore.set('shop:goodshop:sub', { status: 'active', startAt: Date.now(), endAt: Date.now() + 2592000000 });
    mockStore.set('shop:goodshop:config', { pixelKey: 'my_pixel_key', categoryId: 166 });
    const [req, ctx] = createPixelRequest('goodshop');
    const res = await GET(req, ctx);
    const text = await res.text();
    expect(text).toContain('var PIXEL_KEY="my_pixel_key"');
    expect(text).toContain('var CATEGORY_ID=166');
    expect(text).toContain('axon("init")');
    expect(res.headers.get('content-type')).toBe('application/javascript');
  });

  it('returns full pixel script for active trial', async () => {
    mockStore.set('shop:trialshop:sub', { status: 'trial', startAt: Date.now(), endAt: Date.now() + 259200000 });
    mockStore.set('shop:trialshop:config', { pixelKey: 'trial_key', categoryId: 200 });
    const [req, ctx] = createPixelRequest('trialshop');
    const res = await GET(req, ctx);
    const text = await res.text();
    expect(text).toContain('var PIXEL_KEY="trial_key"');
    expect(text).toContain('var CATEGORY_ID=200');
  });

  it('sets correct cache headers for inactive', async () => {
    const [req, ctx] = createPixelRequest('nobody');
    const res = await GET(req, ctx);
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
  });

  it('sets correct cache headers for active', async () => {
    mockStore.set('shop:cached:sub', { status: 'active', startAt: Date.now(), endAt: Date.now() + 100000 });
    mockStore.set('shop:cached:config', { pixelKey: 'k', categoryId: 1 });
    const [req, ctx] = createPixelRequest('cached');
    const res = await GET(req, ctx);
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
  });
});
