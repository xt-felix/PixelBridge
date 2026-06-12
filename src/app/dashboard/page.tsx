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
  { id: 'meta', name: 'Meta', desc: 'Conversions API', color: '#1877F2' },
  { id: 'tiktok', name: 'TikTok', desc: 'Events API', color: '#ff0050' },
  { id: 'google', name: 'Google Ads', desc: 'Enhanced Conversions', color: '#34a853' },
  { id: 'applovin', name: 'AppLovin', desc: 'Axon S2S', color: '#ff6b35' },
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
    const s = params.get('shop') || '';
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
    setTimeout(() => setMessage(''), 4000);
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

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-[960px] mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span className="text-[17px] font-semibold tracking-[-0.02em]">PixelBridge</span>
          </div>
          {shop && (
            <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
              <span className="w-[6px] h-[6px] rounded-full bg-[var(--success)]"></span>
              {shop}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex gap-6 flex-col md:flex-row">
        {/* Sidebar */}
        <nav className="md:w-[200px] flex-shrink-0">
          <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] font-medium mb-3 px-3">Platforms</div>
          <div className="flex flex-row md:flex-col gap-1">
            {platforms.map(p => (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 relative group"
                style={{
                  background: active === p.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                  borderLeft: active === p.id ? `2px solid ${p.color}` : '2px solid transparent',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: active === p.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {p.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] hidden md:block">{p.desc}</div>
                  </div>
                  {isConfigured(p.id) && (
                    <span className="w-[6px] h-[6px] rounded-full bg-[var(--success)]"></span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* Form Area */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            {active === 'meta' && (
              <FormSection
                title="Meta Conversions API"
                description="Forward server-side events to Meta for improved attribution accuracy and higher EMQ scores."
              >
                <Field label="Pixel ID" value={metaPixelId} onChange={setMetaPixelId} placeholder="123456789012345" hint="Events Manager → Data Sources → Your Pixel" />
                <Field label="Access Token" value={metaToken} onChange={setMetaToken} placeholder="EAAxxxxxxxxx..." type="password" hint="Events Manager → Settings → Generate Access Token" />
              </FormSection>
            )}

            {active === 'tiktok' && (
              <FormSection
                title="TikTok Events API"
                description="Send conversion events to TikTok for better ad optimization and campaign performance."
              >
                <Field label="Pixel Code" value={ttPixelCode} onChange={setTtPixelCode} placeholder="CXXXXXXXXXXXXXXXXX" hint="TikTok Ads Manager → Assets → Events" />
                <Field label="Access Token" value={ttToken} onChange={setTtToken} placeholder="Server-side access token" type="password" hint="TikTok Business Center → Settings → Data Access" />
              </FormSection>
            )}

            {active === 'google' && (
              <FormSection
                title="Google Ads Enhanced Conversions"
                description="Upload click conversions with gclid matching for maximum attribution precision."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="OAuth Client ID" value={gClientId} onChange={setGClientId} placeholder="xxxx.apps.googleusercontent.com" />
                  <Field label="OAuth Client Secret" value={gClientSecret} onChange={setGClientSecret} type="password" placeholder="GOCSPX-xxxxxxxx" />
                  <Field label="Refresh Token" value={gRefreshToken} onChange={setGRefreshToken} type="password" placeholder="1//xxxxxxxx" />
                  <Field label="Developer Token" value={gDevToken} onChange={setGDevToken} placeholder="xxxxxxxxxxxxxxxx" />
                  <Field label="Customer ID" value={gCustomerId} onChange={setGCustomerId} placeholder="1234567890" hint="10 digits, no dashes" />
                  <Field label="Conversion Action ID" value={gConversionId} onChange={setGConversionId} placeholder="123456789" />
                </div>
              </FormSection>
            )}

            {active === 'applovin' && (
              <FormSection
                title="AppLovin Axon S2S"
                description="Server-to-server event postback for AppLovin ad attribution and ROAS optimization."
              >
                <Field label="SDK Key" value={alSdkKey} onChange={setAlSdkKey} placeholder="Your AppLovin SDK Key" hint="AppLovin Dashboard → Account → Keys" />
              </FormSection>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6">
            {message === 'success' && (
              <div className="mb-4 px-4 py-3 rounded-lg border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.05)] flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span className="text-[13px] text-[var(--success)]">Saved. Tracking script injected.</span>
              </div>
            )}
            {message === 'error' && (
              <div className="mb-4 px-4 py-3 rounded-lg border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
                <span className="text-[13px] text-[var(--error)]">Failed to save. Try again.</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !shop}
              className="w-full py-3 rounded-lg text-[14px] font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: saving || !shop ? 'var(--bg-input)' : 'var(--accent)',
                color: 'white',
                boxShadow: saving || !shop ? 'none' : '0 0 20px rgba(99, 102, 241, 0.3)',
              }}
            >
              {saving ? 'Saving...' : 'Save & Activate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1">{title}</h2>
      <p className="text-[13px] text-[var(--text-muted)] mb-6 leading-relaxed">{description}</p>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5 tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <p className="text-[11px] text-[var(--text-muted)] mt-1.5">{hint}</p>}
    </div>
  );
}
