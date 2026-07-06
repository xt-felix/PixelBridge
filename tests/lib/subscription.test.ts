import { describe, it, expect } from 'vitest';
import { isSubscriptionActive } from '@/lib/subscription';

describe('subscription state machine', () => {
  it('trial is active when within end date', () => {
    const sub = { status: 'trial' as const, startAt: Date.now(), endAt: Date.now() + 100000 };
    expect(isSubscriptionActive(sub)).toBe(true);
  });

  it('trial is expired when past end date', () => {
    const sub = { status: 'trial' as const, startAt: Date.now() - 200000, endAt: Date.now() - 1000 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('active subscription is active when within end date', () => {
    const sub = { status: 'active' as const, startAt: Date.now(), endAt: Date.now() + 2592000000 };
    expect(isSubscriptionActive(sub)).toBe(true);
  });

  it('active subscription is expired when past end date', () => {
    const sub = { status: 'active' as const, startAt: Date.now() - 5000000, endAt: Date.now() - 1000 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('expired subscription is not active', () => {
    const sub = { status: 'expired' as const, startAt: 0, endAt: 0 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('cancelled subscription is not active', () => {
    const sub = { status: 'cancelled' as const, startAt: 0, endAt: 0 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('null subscription is not active', () => {
    expect(isSubscriptionActive(null)).toBe(false);
  });
});
