import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStore = new Map<string, unknown>();
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn((key: string) => mockStore.get(key) || null),
    set: vi.fn((key: string, value: unknown) => { mockStore.set(key, value); }),
    del: vi.fn((...keys: string[]) => { keys.forEach(k => mockStore.delete(k)); }),
  },
}));

import {
  getShopConfig, saveShopConfig,
  getShopSubscription, saveShopSubscription,
  getShopToken, saveShopToken,
  incrementShopStats, getShopStats,
  deleteShopData,
} from '@/lib/shop';

describe('shop data layer', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  describe('config', () => {
    it('returns null for non-existent config', async () => {
      const config = await getShopConfig('nonexistent');
      expect(config).toBeNull();
    });

    it('saves and retrieves config', async () => {
      await saveShopConfig('test-shop', { pixelKey: 'pk_123', categoryId: 166 });
      const config = await getShopConfig('test-shop');
      expect(config).toEqual({ pixelKey: 'pk_123', categoryId: 166 });
    });

    it('overwrites existing config', async () => {
      await saveShopConfig('test-shop', { pixelKey: 'old_key', categoryId: 100 });
      await saveShopConfig('test-shop', { pixelKey: 'new_key', categoryId: 200 });
      const config = await getShopConfig('test-shop');
      expect(config).toEqual({ pixelKey: 'new_key', categoryId: 200 });
    });
  });

  describe('subscription', () => {
    it('returns null for non-existent subscription', async () => {
      const sub = await getShopSubscription('nonexistent');
      expect(sub).toBeNull();
    });

    it('saves and retrieves subscription', async () => {
      const sub = { status: 'trial' as const, startAt: 1000, endAt: 2000 };
      await saveShopSubscription('test-shop', sub);
      const result = await getShopSubscription('test-shop');
      expect(result).toEqual(sub);
    });

    it('saves subscription with optional fields', async () => {
      const sub = { status: 'active' as const, startAt: 1000, endAt: 2000, spuKey: 'pro', autoRenew: true };
      await saveShopSubscription('test-shop', sub);
      const result = await getShopSubscription('test-shop');
      expect(result!.spuKey).toBe('pro');
      expect(result!.autoRenew).toBe(true);
    });
  });

  describe('token', () => {
    it('returns null for non-existent token', async () => {
      const token = await getShopToken('nonexistent');
      expect(token).toBeNull();
    });

    it('saves and retrieves token', async () => {
      await saveShopToken('test-shop', { accessToken: 'tok_abc', shopDomain: 'test-shop.myshopline.com' });
      const token = await getShopToken('test-shop');
      expect(token).toEqual({ accessToken: 'tok_abc', shopDomain: 'test-shop.myshopline.com' });
    });
  });

  describe('stats', () => {
    it('returns null for non-existent stats', async () => {
      const stats = await getShopStats('nonexistent');
      expect(stats).toBeNull();
    });

    it('initializes stats from zero', async () => {
      await incrementShopStats('test-shop', { pv: 5, atc: 2 });
      const stats = await getShopStats('test-shop');
      expect(stats!.pv).toBe(5);
      expect(stats!.atc).toBe(2);
      expect(stats!.bc).toBe(0);
      expect(stats!.pc).toBe(0);
      expect(stats!.gmv).toBe(0);
      expect(stats!.lastSeen).toBeGreaterThan(0);
    });

    it('accumulates stats across multiple increments', async () => {
      await incrementShopStats('test-shop', { pv: 5, atc: 2 });
      await incrementShopStats('test-shop', { pv: 3, pc: 1, gmv: 49.99 });
      await incrementShopStats('test-shop', { pv: 2, gmv: 25.01 });
      const stats = await getShopStats('test-shop');
      expect(stats!.pv).toBe(10);
      expect(stats!.atc).toBe(2);
      expect(stats!.pc).toBe(1);
      expect(stats!.gmv).toBe(75);
    });

    it('handles floating point GMV correctly', async () => {
      await incrementShopStats('test-shop', { gmv: 0.1 });
      await incrementShopStats('test-shop', { gmv: 0.2 });
      const stats = await getShopStats('test-shop');
      expect(stats!.gmv).toBe(0.3);
    });
  });

  describe('deleteShopData', () => {
    it('deletes all shop data', async () => {
      await saveShopConfig('test-shop', { pixelKey: 'k', categoryId: 1 });
      await saveShopSubscription('test-shop', { status: 'active', startAt: 0, endAt: 0 });
      await saveShopToken('test-shop', { accessToken: 'tok', shopDomain: 'd' });
      await incrementShopStats('test-shop', { pv: 10 });

      await deleteShopData('test-shop');

      expect(await getShopConfig('test-shop')).toBeNull();
      expect(await getShopSubscription('test-shop')).toBeNull();
      expect(await getShopToken('test-shop')).toBeNull();
      expect(await getShopStats('test-shop')).toBeNull();
    });
  });
});
