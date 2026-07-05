import { type ShopSubscription } from './shop';

export const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

export function isSubscriptionActive(sub: ShopSubscription | null): boolean {
  if (!sub) return false;
  if (sub.status === 'active') return true;
  if (sub.status === 'trial') return Date.now() < sub.trialEnd;
  return false;
}

export function createTrialSubscription(): ShopSubscription {
  return {
    status: 'trial',
    trialEnd: Date.now() + TRIAL_DURATION_MS,
  };
}

export function getSubscriptionDisplayStatus(sub: ShopSubscription | null): {
  label: string;
  daysLeft?: number;
} {
  if (!sub) return { label: 'Not installed' };
  if (sub.status === 'active') return { label: 'Active' };
  if (sub.status === 'cancelled') return { label: 'Cancelled' };
  if (sub.status === 'expired') return { label: 'Expired' };
  if (sub.status === 'trial') {
    const msLeft = sub.trialEnd - Date.now();
    if (msLeft <= 0) return { label: 'Expired' };
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    return { label: `Trial (${daysLeft} day${daysLeft > 1 ? 's' : ''} left)`, daysLeft };
  }
  return { label: 'Unknown' };
}
