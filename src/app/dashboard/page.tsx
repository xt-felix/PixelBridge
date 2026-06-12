'use client';

import { useState, useEffect } from 'react';

interface PixelConfig {
  shop: string;
  meta?: { pixelId: string; accessToken: string } | null;
  google?: { clientId: string; clientSecret: string; refreshToken: string; developerToken: string; customerId: string; conversionActionId: string } | null;
  tiktok?: { pixelCode: string; accessToken: string } | null;
  applovin?: { sdkKey: string } | null;
}

export default function Dashboard() {
  const [shop, setShop] = useState('');
  const [config, setConfig] = useState<PixelConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Meta
  const [metaPixelId, setMetaPixelId] = useState('');
  const [metaToken, setMetaToken] = useState('');

  // TikTok
  const [ttPixelCode, setTtPixelCode] = useState('');
  const [ttToken, setTtToken] = useState('');

  // Google
  const [gClientId, setGClientId] = useState('');
  const [gClientSecret, setGClientSecret] = useState('');
  const [gRefreshToken, setGRefreshToken] = useState('');
  const [gDevToken, setGDevToken] = useState('');
  const [gCustomerId, setGCustomerId] = useState('');
  const [gConversionId, setGConversionId] = useState('');

  // AppLovin
  const [alSdkKey, setAlSdkKey] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('shop') || '';
    setShop(s);
    if (s) loadConfig(s);
  }, []);

  async function loadConfig(shopHandle: string) {
    const res = await fetch(`/api/pixel/config?shop=${shopHandle}`);
    const data = await res.json();
    setConfig(data);
    if (data.meta) {
      setMetaPixelId(data.meta.pixelId || '');
      setMetaToken(data.meta.accessToken || '');
    }
    if (data.tiktok) {
      setTtPixelCode(data.tiktok.pixelCode || '');
      setTtToken(data.tiktok.accessToken || '');
    }
    if (data.google) {
      setGClientId(data.google.clientId || '');
      setGClientSecret(data.google.clientSecret || '');
      setGRefreshToken(data.google.refreshToken || '');
      setGDevToken(data.google.developerToken || '');
      setGCustomerId(data.google.customerId || '');
      setGConversionId(data.google.conversionActionId || '');
    }
    if (data.applovin) {
      setAlSdkKey(data.applovin.sdkKey || '');
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    const payload: PixelConfig = {
      shop,
      meta: metaPixelId && metaToken ? { pixelId: metaPixelId, accessToken: metaToken } : null,
      tiktok: ttPixelCode && ttToken ? { pixelCode: ttPixelCode, accessToken: ttToken } : null,
      google: gClientId && gCustomerId ? {
        clientId: gClientId, clientSecret: gClientSecret, refreshToken: gRefreshToken,
        developerToken: gDevToken, customerId: gCustomerId, conversionActionId: gConversionId,
      } : null,
      applovin: alSdkKey ? { sdkKey: alSdkKey } : null,
    };

    const res = await fetch('/api/pixel/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setMessage('Configuration saved successfully!');
    } else {
      setMessage('Failed to save. Please try again.');
    }
    setSaving(false);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">PixelBridge</h1>
        <p className="text-gray-500 mt-1">Configure your advertising pixels for server-side tracking</p>
        {shop && <p className="text-sm text-blue-600 mt-1">Store: {shop}</p>}
      </div>

      {/* Script Tag Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-1">Tracking Script</h3>
        <p className="text-sm text-blue-700">
          After saving your configuration, the tracking script will be automatically injected into your store.
        </p>
        <code className="text-xs bg-blue-100 px-2 py-1 rounded mt-2 block overflow-x-auto">
          {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/pixelbridge.js?shop=${shop}&server=${typeof window !== 'undefined' ? window.location.origin : ''}"></script>`}
        </code>
      </div>

      {/* Meta / Facebook */}
      <Section title="Meta (Facebook) Pixel" icon="📘">
        <Field label="Pixel ID" value={metaPixelId} onChange={setMetaPixelId} placeholder="e.g. 123456789012345" />
        <Field label="Conversions API Access Token" value={metaToken} onChange={setMetaToken} placeholder="Your CAPI access token" type="password" />
      </Section>

      {/* TikTok */}
      <Section title="TikTok Events API" icon="🎵">
        <Field label="Pixel Code" value={ttPixelCode} onChange={setTtPixelCode} placeholder="e.g. CXXXXXXXXXXXXXXXXX" />
        <Field label="Access Token" value={ttToken} onChange={setTtToken} placeholder="Your TikTok Events API token" type="password" />
      </Section>

      {/* Google Ads */}
      <Section title="Google Ads Enhanced Conversions" icon="🔍">
        <Field label="Client ID" value={gClientId} onChange={setGClientId} placeholder="OAuth Client ID" />
        <Field label="Client Secret" value={gClientSecret} onChange={setGClientSecret} placeholder="OAuth Client Secret" type="password" />
        <Field label="Refresh Token" value={gRefreshToken} onChange={setGRefreshToken} placeholder="OAuth Refresh Token" type="password" />
        <Field label="Developer Token" value={gDevToken} onChange={setGDevToken} placeholder="Google Ads Developer Token" />
        <Field label="Customer ID" value={gCustomerId} onChange={setGCustomerId} placeholder="e.g. 1234567890 (no dashes)" />
        <Field label="Conversion Action ID" value={gConversionId} onChange={setGConversionId} placeholder="Conversion Action ID" />
      </Section>

      {/* AppLovin */}
      <Section title="AppLovin / Axon" icon="🚀">
        <Field label="SDK Key" value={alSdkKey} onChange={setAlSdkKey} placeholder="Your AppLovin SDK Key" />
      </Section>

      {/* Save */}
      <div className="mt-8">
        {message && (
          <p className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !shop}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? 'Saving...' : 'Save & Activate'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-800">
          <span>{icon}</span> {title}
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-4 pt-0 border-t border-gray-100">{children}</div>}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  );
}
