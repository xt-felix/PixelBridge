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

  it('returns "// not configured" when no config exists', async () => {
    const [req, ctx] = createPixelRequest('noshop');
    const res = await GET(req, ctx);
    const text = await res.text();
    expect(text).toBe('// not configured');
    expect(res.headers.get('content-type')).toBe('application/javascript');
  });

  it('returns "// not configured" when config has empty pixelKey', async () => {
    mockStore.set('shop:emptykey:config', { pixelKey: '', categoryId: 166 });
    const [req, ctx] = createPixelRequest('emptykey');
    const res = await GET(req, ctx);
    const text = await res.text();
    expect(text).toBe('// not configured');
  });

  it('returns full pixel script when configured', async () => {
    mockStore.set('shop:goodshop:config', { pixelKey: 'my_pixel_key', categoryId: 166 });
    const [req, ctx] = createPixelRequest('goodshop');
    const res = await GET(req, ctx);
    const text = await res.text();
    expect(text).toContain('var PIXEL_KEY="my_pixel_key"');
    expect(text).toContain('var CATEGORY_ID=166');
    expect(text).toContain('axon("init")');
    expect(res.headers.get('content-type')).toBe('application/javascript');
  });

  it('returns full pixel script with custom categoryId', async () => {
    mockStore.set('shop:custom:config', { pixelKey: 'trial_key', categoryId: 200 });
    const [req, ctx] = createPixelRequest('custom');
    const res = await GET(req, ctx);
    const text = await res.text();
    expect(text).toContain('var PIXEL_KEY="trial_key"');
    expect(text).toContain('var CATEGORY_ID=200');
  });

  it('sets correct cache headers for not configured', async () => {
    const [req, ctx] = createPixelRequest('nobody');
    const res = await GET(req, ctx);
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
  });

  it('sets correct cache headers for active', async () => {
    mockStore.set('shop:cached:config', { pixelKey: 'k', categoryId: 1 });
    const [req, ctx] = createPixelRequest('cached');
    const res = await GET(req, ctx);
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
  });
});
