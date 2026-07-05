import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/redis', () => {
  const store = new Map<string, unknown>();
  return {
    redis: {
      get: vi.fn((key: string) => store.get(key) || null),
      set: vi.fn((key: string, value: unknown) => { store.set(key, value); }),
      del: vi.fn((...keys: string[]) => { keys.forEach(k => store.delete(k)); }),
    },
  };
});

import {
  getShopConfig, saveShopConfig,
  getShopSubscription, saveShopSubscription,
  incrementShopStats, getShopStats,
} from '@/lib/shop';

describe('shop data layer', () => {
  it('saves and retrieves shop config', async () => {
    await saveShopConfig('test-shop', { pixelKey: 'pk_123', categoryId: 166 });
    const config = await getShopConfig('test-shop');
    expect(config).toEqual({ pixelKey: 'pk_123', categoryId: 166 });
  });

  it('saves and retrieves subscription', async () => {
    const sub = { status: 'trial' as const, trialEnd: Date.now() + 259200000 };
    await saveShopSubscription('test-shop', sub);
    const result = await getShopSubscription('test-shop');
    expect(result?.status).toBe('trial');
  });

  it('increments stats correctly', async () => {
    await incrementShopStats('test-shop', { pv: 5, atc: 2 });
    await incrementShopStats('test-shop', { pv: 3, pc: 1, gmv: 49.99 });
    const stats = await getShopStats('test-shop');
    expect(stats?.pv).toBe(8);
    expect(stats?.atc).toBe(2);
    expect(stats?.pc).toBe(1);
    expect(stats?.gmv).toBe(49.99);
  });
});
