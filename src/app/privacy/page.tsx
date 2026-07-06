import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - PixelBridge',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 px-4 md:px-6">
      <div className="max-w-3xl mx-auto prose prose-sm prose-gray">
        <h1 className="text-2xl font-bold text-[var(--brand-primary)] mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: July 6, 2026</p>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">1. Introduction</h2>
          <p>
            PixelBridge (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the App&rdquo;) is a Shopline application that enables
            merchants to install the AppLovin Axon Pixel on their online stores. This Privacy Policy explains how we
            collect, use, and protect information when you use our application.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">2. Information We Collect</h2>
          <h3 className="text-base font-medium">From Merchants (App Users)</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Shop domain and identifier (provided by Shopline during installation)</li>
            <li>AppLovin Axon Pixel Key (entered by merchant in the dashboard)</li>
            <li>Subscription status (managed by Shopline)</li>
          </ul>
          <h3 className="text-base font-medium">From Store Visitors</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Page view events</li>
            <li>Add-to-cart events</li>
            <li>Checkout initiation events</li>
            <li>Purchase events (order ID, total amount)</li>
          </ul>
          <p>
            These events are sent directly to AppLovin&apos;s Axon platform via their pixel SDK.
            We only store aggregate counts (total page views, add-to-carts, checkouts, purchases, and GMV)
            for display in the merchant dashboard.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">3. How We Use Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide the pixel installation and tracking service</li>
            <li>To display aggregate event statistics to merchants</li>
            <li>To manage subscription status and access control</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">4. Data Sharing</h2>
          <p>
            Store visitor event data is sent to <strong>AppLovin</strong> via their Axon Pixel SDK for ad
            attribution and optimization purposes. We do not sell, rent, or share merchant or visitor data
            with any other third parties.
          </p>
          <p>
            Please refer to{' '}
            <a href="https://www.applovin.com/privacy/" className="text-[var(--brand-accent)] underline" target="_blank" rel="noopener noreferrer">
              AppLovin&apos;s Privacy Policy
            </a>{' '}
            for details on how they process event data.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">5. Data Storage and Security</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Merchant configuration and aggregate statistics are stored in Upstash Redis (encrypted at rest, TLS in transit)</li>
            <li>We do not store individual visitor personal data on our servers</li>
            <li>Access tokens are stored securely and used only for authorized API calls</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">6. Data Retention</h2>
          <p>
            When a merchant uninstalls the app, all associated data (configuration, tokens, and statistics)
            is permanently deleted from our systems via the <code>app/uninstalled</code> webhook.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">7. Merchant Rights</h2>
          <p>Merchants can:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>View their stored configuration at any time via the dashboard</li>
            <li>Update or remove their pixel key</li>
            <li>Uninstall the app to delete all data</li>
            <li>Contact us to request data export or deletion</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be reflected on this page
            with an updated &ldquo;Last updated&rdquo; date.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">9. Contact</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:{' '}
            <a href="mailto:support@pixelbridge.app" className="text-[var(--brand-accent)] underline">
              support@pixelbridge.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
