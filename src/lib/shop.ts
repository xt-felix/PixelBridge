import { redis } from './redis';

export interface ShopConfig {
  pixelKey: string;
  categoryId: number;
}

export interface ShopSubscription {
  status: 'trial' | 'expired' | 'active' | 'cancelled';
  trialEnd: number;
  chargeId?: string;
}

export interface ShopToken {
  accessToken: string;
  shopDomain: string;
}

export interface ShopStats {
  pv: number;
  atc: number;
  bc: number;
  pc: number;
  gmv: number;
  lastSeen: number;
}

const key = {
  config: (shopId: string) => `shop:${shopId}:config`,
  sub: (shopId: string) => `shop:${shopId}:sub`,
  token: (shopId: string) => `shop:${shopId}:token`,
  stats: (shopId: string) => `shop:${shopId}:stats`,
};

export async function getShopConfig(shopId: string): Promise<ShopConfig | null> {
  return redis.get<ShopConfig>(key.config(shopId));
}

export async function saveShopConfig(shopId: string, config: ShopConfig): Promise<void> {
  await redis.set(key.config(shopId), config);
}

export async function getShopSubscription(shopId: string): Promise<ShopSubscription | null> {
  return redis.get<ShopSubscription>(key.sub(shopId));
}

export async function saveShopSubscription(shopId: string, sub: ShopSubscription): Promise<void> {
  await redis.set(key.sub(shopId), sub);
}

export async function getShopToken(shopId: string): Promise<ShopToken | null> {
  return redis.get<ShopToken>(key.token(shopId));
}

export async function saveShopToken(shopId: string, token: ShopToken): Promise<void> {
  await redis.set(key.token(shopId), token);
}

export async function getShopStats(shopId: string): Promise<ShopStats | null> {
  return redis.get<ShopStats>(key.stats(shopId));
}

export async function incrementShopStats(shopId: string, delta: Partial<ShopStats>): Promise<void> {
  const current = await getShopStats(shopId) || { pv: 0, atc: 0, bc: 0, pc: 0, gmv: 0, lastSeen: 0 };
  const updated: ShopStats = {
    pv: current.pv + (delta.pv || 0),
    atc: current.atc + (delta.atc || 0),
    bc: current.bc + (delta.bc || 0),
    pc: current.pc + (delta.pc || 0),
    gmv: Math.round((current.gmv + (delta.gmv || 0)) * 100) / 100,
    lastSeen: Date.now(),
  };
  await redis.set(key.stats(shopId), updated);
}

export async function deleteShopData(shopId: string): Promise<void> {
  await redis.del(key.config(shopId), key.sub(shopId), key.token(shopId), key.stats(shopId));
}
