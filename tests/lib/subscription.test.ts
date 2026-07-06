import { describe, it, expect } from 'vitest';
import { isSubscriptionActive, getSubscriptionDisplayStatus } from '@/lib/subscription';

describe('isSubscriptionActive', () => {
  it('returns false for null subscription', () => {
    expect(isSubscriptionActive(null)).toBe(false);
  });

  it('trial is active when current time is before endAt', () => {
    const sub = { status: 'trial' as const, startAt: Date.now() - 1000, endAt: Date.now() + 100000 };
    expect(isSubscriptionActive(sub)).toBe(true);
  });

  it('trial is inactive when current time is past endAt', () => {
    const sub = { status: 'trial' as const, startAt: Date.now() - 300000, endAt: Date.now() - 1000 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('trial is inactive when endAt equals current time', () => {
    const now = Date.now();
    const sub = { status: 'trial' as const, startAt: now - 100000, endAt: now - 1 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('active subscription is active when within end date', () => {
    const sub = { status: 'active' as const, startAt: Date.now(), endAt: Date.now() + 2592000000 };
    expect(isSubscriptionActive(sub)).toBe(true);
  });

  it('active subscription is inactive when past end date', () => {
    const sub = { status: 'active' as const, startAt: Date.now() - 5000000, endAt: Date.now() - 1000 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('expired subscription is never active', () => {
    const sub = { status: 'expired' as const, startAt: 0, endAt: 0 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('expired subscription with future endAt is still not active', () => {
    const sub = { status: 'expired' as const, startAt: 0, endAt: Date.now() + 100000 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('cancelled subscription is never active', () => {
    const sub = { status: 'cancelled' as const, startAt: 0, endAt: 0 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('cancelled subscription with future endAt is still not active', () => {
    const sub = { status: 'cancelled' as const, startAt: 0, endAt: Date.now() + 100000 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });
});

describe('getSubscriptionDisplayStatus', () => {
  it('returns Pending for null subscription', () => {
    expect(getSubscriptionDisplayStatus(null)).toEqual({ label: 'Pending' });
  });

  it('returns Cancelled for cancelled status', () => {
    const sub = { status: 'cancelled' as const, startAt: 0, endAt: 0 };
    expect(getSubscriptionDisplayStatus(sub)).toEqual({ label: 'Cancelled' });
  });

  it('returns Expired for expired status', () => {
    const sub = { status: 'expired' as const, startAt: 0, endAt: 0 };
    expect(getSubscriptionDisplayStatus(sub)).toEqual({ label: 'Expired' });
  });

  it('returns Expired for trial with past endAt', () => {
    const sub = { status: 'trial' as const, startAt: Date.now() - 400000, endAt: Date.now() - 1000 };
    expect(getSubscriptionDisplayStatus(sub)).toEqual({ label: 'Expired' });
  });

  it('returns Trial with days left for active trial', () => {
    const sub = { status: 'trial' as const, startAt: Date.now(), endAt: Date.now() + 2 * 24 * 60 * 60 * 1000 };
    const result = getSubscriptionDisplayStatus(sub);
    expect(result.label).toBe('Trial (2 days left)');
    expect(result.daysLeft).toBe(2);
  });

  it('returns Trial with 1 day left (singular)', () => {
    const sub = { status: 'trial' as const, startAt: Date.now(), endAt: Date.now() + 12 * 60 * 60 * 1000 };
    const result = getSubscriptionDisplayStatus(sub);
    expect(result.label).toBe('Trial (1 day left)');
    expect(result.daysLeft).toBe(1);
  });

  it('returns Active with days left for active subscription', () => {
    const sub = { status: 'active' as const, startAt: Date.now(), endAt: Date.now() + 30 * 24 * 60 * 60 * 1000 };
    const result = getSubscriptionDisplayStatus(sub);
    expect(result.label).toBe('Active');
    expect(result.daysLeft).toBe(30);
  });

  it('returns Expired for active subscription with past endAt', () => {
    const sub = { status: 'active' as const, startAt: Date.now() - 5000000, endAt: Date.now() - 1000 };
    expect(getSubscriptionDisplayStatus(sub)).toEqual({ label: 'Expired' });
  });
});
