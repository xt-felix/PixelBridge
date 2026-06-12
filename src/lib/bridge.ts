import { redis } from './redis';

export interface BridgeData {
  fbp?: string;
  fbc?: string;
  gclid?: string;
  ttclid?: string;
  axwrt?: string;
  ua?: string;
  ip?: string;
  url?: string;
  referrer?: string;
  timestamp: number;
}

const BRIDGE_TTL = 7 * 24 * 60 * 60; // 7 days

export async function saveBridgeData(shop: string, cartToken: string, data: BridgeData) {
  const key = `bridge:${shop}:${cartToken || 'latest'}`;
  const existing = await redis.get<BridgeData>(key);

  if (existing) {
    const merged = { ...existing, ...data };
    await redis.set(key, merged, { ex: BRIDGE_TTL });
  } else {
    await redis.set(key, data, { ex: BRIDGE_TTL });
  }

  if (cartToken) {
    await redis.set(`bridge:${shop}:latest`, data, { ex: BRIDGE_TTL });
  }
}

export async function getBridgeData(shop: string, cartToken: string): Promise<BridgeData | null> {
  if (cartToken) {
    const data = await redis.get<BridgeData>(`bridge:${shop}:${cartToken}`);
    if (data) return data;
  }
  return redis.get<BridgeData>(`bridge:${shop}:latest`);
}
