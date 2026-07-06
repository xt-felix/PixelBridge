import { getShopConfig, getShopSubscription, getShopStats, saveShopConfig } from '@/lib/shop';
import { getSubscriptionDisplayStatus } from '@/lib/subscription';
import { redirect } from 'next/navigation';

async function handleSaveConfig(formData: FormData) {
  'use server';
  const shopId = formData.get('shopId') as string;
  const pixelKey = formData.get('pixelKey') as string;
  const categoryId = parseInt(formData.get('categoryId') as string) || 166;
  await saveShopConfig(shopId, { pixelKey, categoryId });
  redirect(`/dashboard?shop=${shopId}&saved=true`);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; handle?: string; saved?: string; billing?: string }>;
}) {
  const params = await searchParams;
  const shopId = params.shop || params.handle || '';

  if (!shopId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Missing shop parameter. Please install the app from Shopline.</p>
      </div>
    );
  }

  const [config, sub, stats] = await Promise.all([
    getShopConfig(shopId),
    getShopSubscription(shopId),
    getShopStats(shopId),
  ]);

  const displayStatus = getSubscriptionDisplayStatus(sub);
  const isActive = sub?.status === 'active' || (sub?.status === 'trial' && Date.now() < sub.trialEnd);
  const isExpired = !isActive && sub?.status !== 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Axon Pixel for Shopline</h1>

        {params.saved === 'true' && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            Configuration saved successfully!
          </div>
        )}
        {params.billing === 'success' && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            Subscription activated! Your pixel is now active.
          </div>
        )}

        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            isActive ? 'bg-green-100 text-green-800' :
            isExpired ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-600'
          }`}>
            {displayStatus.label}
          </span>
        </div>

        {/* Subscribe CTA */}
        {isExpired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">Trial Expired</h2>
            <p className="text-yellow-800 mb-4">Subscribe to continue tracking conversions. $4.99/month.</p>
            <form action="/api/billing" method="POST">
              <input type="hidden" name="shopId" value={shopId} />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Subscribe Now
              </button>
            </form>
          </div>
        )}

        {/* Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <form action={handleSaveConfig}>
            <input type="hidden" name="shopId" value={shopId} />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Axon Pixel Key
                </label>
                <input
                  name="pixelKey"
                  type="text"
                  defaultValue={config?.pixelKey || ''}
                  placeholder="Enter your AppLovin Axon Pixel Key"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find this in your AppLovin MAX Dashboard → Account → Keys
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category ID
                </label>
                <input
                  name="categoryId"
                  type="number"
                  defaultValue={config?.categoryId || 166}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800"
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Event Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Event Statistics</h2>
          {stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.pv.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Page Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.atc.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Add to Cart</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.bc.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Checkout</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.pc.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Purchase</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between text-sm text-gray-500">
                <span>GMV: ${stats.gmv.toLocaleString()}</span>
                <span>Last activity: {stats.lastSeen ? new Date(stats.lastSeen).toLocaleString() : 'Never'}</span>
              </div>
            </>
          ) : (
            <p className="text-gray-500">No data yet. Events will appear here once your pixel starts firing.</p>
          )}
        </div>
      </div>
    </div>
  );
}
