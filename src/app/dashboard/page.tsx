import { getShopConfig, getShopSubscription, getShopStats, saveShopConfig } from '@/lib/shop';
import { isSubscriptionActive, getSubscriptionDisplayStatus } from '@/lib/subscription';
import { redirect } from 'next/navigation';

async function handleSaveConfig(formData: FormData) {
  'use server';
  const shopId = formData.get('shopId') as string;
  const pixelKey = (formData.get('pixelKey') as string || '').trim();
  const categoryId = parseInt(formData.get('categoryId') as string) || 166;
  if (!pixelKey) {
    redirect(`/dashboard?shop=${shopId}&error=pixel_key_required`);
  }
  const sub = await getShopSubscription(shopId);
  if (!isSubscriptionActive(sub)) {
    redirect(`/dashboard?shop=${shopId}&error=subscription_required`);
  }
  await saveShopConfig(shopId, { pixelKey, categoryId });
  redirect(`/dashboard?shop=${shopId}&saved=true`);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; handle?: string; saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const shopId = params.shop || params.handle || '';

  if (!shopId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="w-12 h-12 rounded-xl bg-[var(--brand-accent)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--brand-primary)] mb-1">Missing Shop Parameter</h2>
          <p className="text-sm text-gray-500">Please install the app from the Shopline App Store.</p>
        </div>
      </div>
    );
  }

  const [config, sub, stats] = await Promise.all([
    getShopConfig(shopId),
    getShopSubscription(shopId),
    getShopStats(shopId),
  ]);

  const displayStatus = getSubscriptionDisplayStatus(sub);
  const isActive = isSubscriptionActive(sub);

  const statusColor = isActive
    ? 'bg-[var(--success-bg)] text-[var(--success)] border-emerald-200'
    : sub?.status === 'expired'
      ? 'bg-[var(--danger-bg)] text-[var(--danger)] border-red-200'
      : 'bg-[var(--warning-bg)] text-[var(--warning)] border-amber-200';

  return (
    <div className="min-h-screen py-8 px-4 md:px-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-[var(--brand-accent)] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--brand-primary)]">PixelBridge</h1>
              <p className="text-xs text-gray-500">Axon Pixel for Shopline</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {params.saved === 'true' && (
          <div className="animate-slide-in flex items-center gap-2 bg-[var(--success-bg)] border border-emerald-200 text-[var(--success)] px-4 py-3 rounded-xl text-sm font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Configuration saved successfully!
          </div>
        )}
        {params.error === 'pixel_key_required' && (
          <div className="animate-slide-in flex items-center gap-2 bg-[var(--danger-bg)] border border-red-200 text-[var(--danger)] px-4 py-3 rounded-xl text-sm font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
            Pixel Key is required. Please enter your AppLovin Axon Pixel Key.
          </div>
        )}
        {params.error === 'subscription_required' && (
          <div className="animate-slide-in flex items-center gap-2 bg-[var(--danger-bg)] border border-red-200 text-[var(--danger)] px-4 py-3 rounded-xl text-sm font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
            Subscription expired. Please renew from the Shopline app management page.
          </div>
        )}

        {/* Status Card */}
        <div className="animate-fade-in-up stagger-1 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-[var(--success)] animate-pulse-dot' : 'bg-gray-300'}`} />
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Subscription</h2>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
              {displayStatus.label}
            </span>
          </div>
          {!isActive && sub?.status === 'expired' && (
            <p className="mt-3 text-sm text-gray-500 pl-5.5">
              Please renew your subscription from the Shopline admin panel.
            </p>
          )}
          {!sub && (
            <div className="mt-4 bg-[var(--brand-accent-light)] rounded-xl p-4">
              <p className="text-sm text-[var(--brand-accent)] font-medium">
                Waiting for subscription activation
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This updates automatically once your plan starts. If you just installed, it may take a moment.
              </p>
            </div>
          )}
        </div>

        {/* Configuration Card */}
        <div className="animate-fade-in-up stagger-2 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-5">Configuration</h2>
          <form action={handleSaveConfig}>
            <input type="hidden" name="shopId" value={shopId} />
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Axon Pixel Key
                </label>
                <input
                  name="pixelKey"
                  type="text"
                  defaultValue={config?.pixelKey || ''}
                  placeholder="e.g. abc123def456..."
                  disabled={!isActive}
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)] transition-shadow disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Find this in your AppLovin MAX Dashboard &rarr; Account &rarr; Keys
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category ID
                </label>
                <input
                  name="categoryId"
                  type="number"
                  defaultValue={config?.categoryId || 166}
                  disabled={!isActive}
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)] transition-shadow disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Default: 166 (E-commerce). Change only if directed by AppLovin.
                </p>
              </div>
              <button
                type="submit"
                disabled={!isActive}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition-all bg-[var(--brand-accent)] text-white hover:opacity-90 active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Stats Card */}
        <div className="animate-fade-in-up stagger-3 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-5">Event Statistics</h2>
          {stats && (stats.pv > 0 || stats.atc > 0 || stats.bc > 0 || stats.pc > 0) ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Page Views" value={stats.pv} />
                <StatCard label="Add to Cart" value={stats.atc} />
                <StatCard label="Checkout" value={stats.bc} />
                <StatCard label="Purchase" value={stats.pc} />
              </div>
              <div className="mt-5 pt-4 border-t border-[var(--border)] flex flex-wrap justify-between gap-2 text-xs text-gray-400">
                <span>GMV: <span className="font-semibold text-gray-600">${stats.gmv.toLocaleString()}</span></span>
                <span>Last: {stats.lastSeen ? new Date(stats.lastSeen).toLocaleString() : '—'}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No events yet</p>
              <p className="text-xs text-gray-400 mt-1">Data appears once your pixel starts firing on the storefront.</p>
            </div>
          )}
        </div>


        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-2 pb-4">
          PixelBridge v1.0 &middot; Powered by AppLovin Axon
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--surface-muted)] rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-[var(--brand-primary)]">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
