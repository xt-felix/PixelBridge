import { describe, it, expect } from 'vitest';
import { isSubscriptionActive, TRIAL_DURATION_MS } from '@/lib/subscription';

describe('subscription state machine', () => {
  it('trial is active when within trial period', () => {
    const sub = { status: 'trial' as const, trialEnd: Date.now() + 100000 };
    expect(isSubscriptionActive(sub)).toBe(true);
  });

  it('trial is expired when past trial end', () => {
    const sub = { status: 'trial' as const, trialEnd: Date.now() - 1000 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('active subscription is always active', () => {
    const sub = { status: 'active' as const, trialEnd: 0, chargeId: 'ch_123' };
    expect(isSubscriptionActive(sub)).toBe(true);
  });

  it('expired subscription is not active', () => {
    const sub = { status: 'expired' as const, trialEnd: Date.now() - 100000 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('cancelled subscription is not active', () => {
    const sub = { status: 'cancelled' as const, trialEnd: 0 };
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('null subscription is not active', () => {
    expect(isSubscriptionActive(null)).toBe(false);
  });

  it('trial duration is 3 days', () => {
    expect(TRIAL_DURATION_MS).toBe(3 * 24 * 60 * 60 * 1000);
  });
});
