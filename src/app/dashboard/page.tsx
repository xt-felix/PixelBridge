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
  const isActive = isSubscriptionActive(sub);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Axon Pixel for Shopline</h1>

        {params.saved === 'true' && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            Configuration saved successfully!
          </div>
        )}
        {params.error === 'pixel_key_required' && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            Pixel Key is required. Please enter your AppLovin Axon Pixel Key.
          </div>
        )}
        {params.error === 'subscription_required' && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            Your subscription has expired. Please renew from the Shopline app management page.
          </div>
        )}

        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            isActive ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {displayStatus.label}
          </span>
          {!isActive && sub?.status === 'expired' && (
            <p className="mt-2 text-sm text-gray-500">
              Please renew your subscription from the Shopline admin panel.
            </p>
          )}
          {!sub && (
            <p className="mt-2 text-sm text-gray-500">
              Waiting for subscription activation. This updates automatically when your plan starts.
            </p>
          )}
        </div>

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
                disabled={!isActive}
                className={`px-6 py-2 rounded-lg font-medium ${isActive ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
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
