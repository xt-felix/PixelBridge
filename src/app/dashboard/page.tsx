'use client';

import { useState, useEffect } from 'react';

interface PixelConfig {
  shop: string;
  meta?: { pixelId: string; accessToken: string } | null;
  google?: { clientId: string; clientSecret: string; refreshToken: string; developerToken: string; customerId: string; conversionActionId: string } | null;
  tiktok?: { pixelCode: string; accessToken: string } | null;
  applovin?: { sdkKey: string } | null;
}

const platforms = [
  { id: 'meta', name: 'Meta (Facebook)', desc: 'Recover 70%+ lost conversions with server-side tracking', color: '#1877F2', icon: 'M' },
  { id: 'tiktok', name: 'TikTok', desc: 'Send events directly to TikTok for better ad optimization', color: '#000000', icon: 'T' },
  { id: 'google', name: 'Google Ads', desc: 'Upload conversions with gclid for precise attribution', color: '#4285F4', icon: 'G' },
  { id: 'applovin', name: 'AppLovin', desc: 'Server-to-server postback for Axon attribution', color: '#FF6B35', icon: 'A' },
];

export default function Dashboard() {
  const [shop, setShop] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<'success' | 'error' | ''>('');
  const [active, setActive] = useState('meta');

  const [metaPixelId, setMetaPixelId] = useState('');
  const [metaToken, setMetaToken] = useState('');
  const [ttPixelCode, setTtPixelCode] = useState('');
  const [ttToken, setTtToken] = useState('');
  const [gClientId, setGClientId] = useState('');
  const [gClientSecret, setGClientSecret] = useState('');
  const [gRefreshToken, setGRefreshToken] = useState('');
  const [gDevToken, setGDevToken] = useState('');
  const [gCustomerId, setGCustomerId] = useState('');
  const [gConversionId, setGConversionId] = useState('');
  const [alSdkKey, setAlSdkKey] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let s = params.get('shop') || params.get('handle') || '';

    // Try to extract from Shopline admin URL (iframe referrer or ancestor)
    if (!s) {
      try {
        const ref = document.referrer;
        const match = ref.match(/\/\/([^.]+)\.myshopline\.com/);
        if (match) s = match[1];
      } catch {}
    }

    // Try from the current page URL path (Shopline embeds at /apps/pixelbridge?shop=xxx)
    if (!s) {
      try {
        const ancestorUrl = window.location.ancestorOrigins?.[0] || '';
        const match = ancestorUrl.match(/\/\/([^.]+)\.myshopline\.com/);
        if (match) s = match[1];
      } catch {}
    }

    // Fallback: use a default for dev store
    if (!s) s = 'pixelbridge-dev';

    setShop(s);
    if (s) loadConfig(s);
  }, []);

  async function loadConfig(shopHandle: string) {
    const res = await fetch(`/api/pixel/config?shop=${shopHandle}`);
    const data = await res.json();
    if (data.meta) { setMetaPixelId(data.meta.pixelId || ''); setMetaToken(data.meta.accessToken || ''); }
    if (data.tiktok) { setTtPixelCode(data.tiktok.pixelCode || ''); setTtToken(data.tiktok.accessToken || ''); }
    if (data.google) {
      setGClientId(data.google.clientId || ''); setGClientSecret(data.google.clientSecret || '');
      setGRefreshToken(data.google.refreshToken || ''); setGDevToken(data.google.developerToken || '');
      setGCustomerId(data.google.customerId || ''); setGConversionId(data.google.conversionActionId || '');
    }
    if (data.applovin) { setAlSdkKey(data.applovin.sdkKey || ''); }
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
      setMessage('success');
      await fetch('/api/scripttag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop }),
      });
    } else {
      setMessage('error');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 5000);
  }

  function isConfigured(id: string) {
    switch (id) {
      case 'meta': return !!(metaPixelId && metaToken);
      case 'tiktok': return !!(ttPixelCode && ttToken);
      case 'google': return !!(gClientId && gCustomerId);
      case 'applovin': return !!alSdkKey;
      default: return false;
    }
  }

  const configuredCount = platforms.filter(p => isConfigured(p.id)).length;

  return (
    <div className="min-h-screen p-5 md:p-8">
      <div className="max-w-[820px] mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div>
              <h1 className="text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>PixelBridge</h1>
            </div>
          </div>
          {shop && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }}></span>
              Connected
            </div>
          )}
        </header>

        {/* Welcome Card */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--accent-light)', border: '1px solid #e0dcff' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--accent)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Set up your tracking in 2 minutes
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Select a platform below, paste your credentials, and hit Save. We handle everything else — script injection, event capture, and server-side forwarding.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className="relative p-4 rounded-xl text-left transition-all duration-150"
              style={{
                background: active === p.id ? 'var(--bg-card)' : 'transparent',
                border: active === p.id ? `2px solid ${p.color}` : '2px solid var(--border-default)',
                boxShadow: active === p.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white" style={{ background: p.color }}>
                  {p.icon}
                </span>
                <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name.split(' ')[0]}</span>
              </div>
              {isConfigured(p.id) && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: 'var(--success)' }}></span>
              )}
            </button>
          ))}
        </div>

        {/* Form Card */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {active === 'meta' && (
            <FormSection
              title="Meta Conversions API"
              description="Forward purchase events to Meta with full user data — email, phone, fbp, fbc. Our Cookie Bridge preserves attribution across Shopline's cross-domain checkout."
            >
              <Field label="Pixel ID" value={metaPixelId} onChange={setMetaPixelId} placeholder="e.g. 547832910234567" hint="Find in Events Manager → Data Sources → Select your pixel" />
              <Field label="Access Token" value={metaToken} onChange={setMetaToken} placeholder="Paste your Conversions API token" type="password" hint="Events Manager → Settings → Conversions API → Generate access token" />
            </FormSection>
          )}

          {active === 'tiktok' && (
            <FormSection
              title="TikTok Events API"
              description="Send server-side events with ttclid matching. Our Cookie Bridge captures the click ID before cross-domain checkout loses it."
            >
              <Field label="Pixel Code" value={ttPixelCode} onChange={setTtPixelCode} placeholder="e.g. CJLK8A3C77U5TN1FGVEG" hint="TikTok Ads Manager → Assets → Events → Manage (Web Events)" />
              <Field label="Access Token" value={ttToken} onChange={setTtToken} placeholder="Paste your Events API token" type="password" hint="Settings → Data Access → Tokens → Create" />
            </FormSection>
          )}

          {active === 'google' && (
            <FormSection
              title="Google Ads Enhanced Conversions"
              description="Upload purchase conversions with gclid for direct click attribution. Falls back to email-based matching when gclid is unavailable."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <Field label="OAuth Client ID" value={gClientId} onChange={setGClientId} placeholder="xxxxx.apps.googleusercontent.com" />
                <Field label="OAuth Client Secret" value={gClientSecret} onChange={setGClientSecret} type="password" placeholder="GOCSPX-xxxxxxxx" />
                <Field label="Refresh Token" value={gRefreshToken} onChange={setGRefreshToken} type="password" placeholder="1//0exxxxxxxx" />
                <Field label="Developer Token" value={gDevToken} onChange={setGDevToken} placeholder="xXxXxXxXxXxXxXxX" />
                <Field label="Customer ID" value={gCustomerId} onChange={setGCustomerId} placeholder="1234567890" hint="10 digits without dashes" />
                <Field label="Conversion Action ID" value={gConversionId} onChange={setGConversionId} placeholder="123456789" />
              </div>
            </FormSection>
          )}

          {active === 'applovin' && (
            <FormSection
              title="AppLovin Axon S2S"
              description="Server-to-server postback using the _axwrt cookie. Our Cookie Bridge preserves the Axon attribution ID through checkout."
            >
              <Field label="SDK Key" value={alSdkKey} onChange={setAlSdkKey} placeholder="Paste your SDK Key" hint="AppLovin Dashboard → Account → Keys" />
            </FormSection>
          )}
        </div>

        {/* Status Messages */}
        {message === 'success' && (
          <div className="mt-4 px-4 py-3 rounded-xl flex items-center gap-2" style={{ background: 'var(--success-light)', border: '1px solid #bbf7d0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span className="text-[13px] font-medium" style={{ color: '#166534' }}>All set! Tracking is now active on your store.</span>
          </div>
        )}
        {message === 'error' && (
          <div className="mt-4 px-4 py-3 rounded-xl flex items-center gap-2" style={{ background: 'var(--error-light)', border: '1px solid #fecaca' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
            <span className="text-[13px] font-medium" style={{ color: '#991b1b' }}>Something went wrong. Please check your credentials and try again.</span>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !shop}
          className="w-full mt-5 py-3.5 rounded-xl text-[15px] font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
          style={{
            background: 'var(--accent)',
            boxShadow: saving || !shop ? 'none' : '0 2px 12px rgba(99, 91, 255, 0.25)',
          }}
        >
          {saving ? 'Saving...' : `Save & Activate${configuredCount > 0 ? ` (${configuredCount} platform${configuredCount > 1 ? 's' : ''})` : ''}`}
        </button>

        {/* Footer hint */}
        <p className="text-center text-[12px] mt-4" style={{ color: 'var(--text-muted)' }}>
          Need help? Check our <a href="#" className="underline">setup guide</a> or contact support.
        </p>
      </div>
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[16px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      <p className="text-[13px] leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}
