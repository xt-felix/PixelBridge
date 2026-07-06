import { type ShopSubscription } from './shop';

export function isSubscriptionActive(sub: ShopSubscription | null): boolean {
  if (!sub) return false;
  if (sub.status === 'active') return Date.now() < sub.endAt;
  if (sub.status === 'trial') return Date.now() < sub.endAt;
  return false;
}

export function getSubscriptionDisplayStatus(sub: ShopSubscription | null): {
  label: string;
  daysLeft?: number;
} {
  if (!sub) return { label: 'Pending' };
  if (sub.status === 'cancelled') return { label: 'Cancelled' };
  if (sub.status === 'expired') return { label: 'Expired' };

  const msLeft = sub.endAt - Date.now();
  if (msLeft <= 0) return { label: 'Expired' };

  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

  if (sub.status === 'active') return { label: 'Active', daysLeft };
  if (sub.status === 'trial') {
    return { label: `Trial (${daysLeft} day${daysLeft > 1 ? 's' : ''} left)`, daysLeft };
  }
  return { label: 'Unknown' };
}
