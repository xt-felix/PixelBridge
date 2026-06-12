import { redis } from './redis';

export interface ShopConfig {
  shop: string;
  accessToken: string;
  meta?: { pixelId: string; accessToken: string };
  google?: { clientId: string; clientSecret: string; refreshToken: string; developerToken: string; customerId: string; conversionActionId: string };
  tiktok?: { pixelCode: string; accessToken: string };
  applovin?: { sdkKey: string };
}

export async function getShopConfig(shop: string): Promise<ShopConfig | null> {
  return redis.get<ShopConfig>(`config:${shop}`);
}

export async function saveShopConfig(config: ShopConfig): Promise<void> {
  await redis.set(`config:${config.shop}`, config);
}

export async function saveShopSession(shop: string, accessToken: string): Promise<void> {
  await redis.set(`session:${shop}`, { shop, accessToken });
}

export async function getShopSession(shop: string): Promise<{ shop: string; accessToken: string } | null> {
  return redis.get(`session:${shop}`);
}
