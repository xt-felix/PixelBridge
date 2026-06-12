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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<string>('meta');

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
      // Also inject script tag
      await fetch('/api/scripttag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop }),
      });
    } else {
      setMessage('error');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  const tabs = [
    { id: 'meta', label: 'Meta', color: '#1877F2' },
    { id: 'tiktok', label: 'TikTok', color: '#000000' },
    { id: 'google', label: 'Google', color: '#4285F4' },
    { id: 'applovin', label: 'AppLovin', color: '#FF6B35' },
  ];

  const hasConfig = (tab: string) => {
    switch (tab) {
      case 'meta': return !!(metaPixelId && metaToken);
      case 'tiktok': return !!(ttPixelCode && ttToken);
      case 'google': return !!(gClientId && gCustomerId);
      case 'applovin': return !!alSdkKey;
      default: return false;
    }
  };

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', padding: '32px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>PixelBridge</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Server-side conversion tracking for your store</p>
          </div>
        </div>
        {shop && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#f0f9ff', borderRadius: '20px', fontSize: '13px', color: '#0369a1' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
            Connected: {shop}
          </div>
        )}
      </div>

      {/* Status Banner */}
      <div style={{ background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)', border: '1px solid #e0e7ff', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontWeight: 600, fontSize: '15px', color: '#312e81' }}>Tracking Status</span>
        </div>
        <p style={{ fontSize: '13px', color: '#4b5563', margin: 0, lineHeight: '1.6' }}>
          Configure at least one platform below, then click <strong>Save & Activate</strong>. The tracking script will be automatically injected into your storefront via ScriptTag API.
        </p>
      </div>

      {/* Platform Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid #e5e7eb',
              background: activeTab === tab.id ? `${tab.color}10` : '#fff',
              color: activeTab === tab.id ? tab.color : '#6b7280',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
            {hasConfig(tab.id) && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
            )}
          </button>
        ))}
      </div>

      {/* Platform Forms */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        {activeTab === 'meta' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a2e', marginBottom: '4px' }}>Meta (Facebook) Conversions API</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Send server-side events to Meta for better attribution and higher Event Match Quality scores.</p>
            <Field label="Pixel ID" value={metaPixelId} onChange={setMetaPixelId} placeholder="e.g. 123456789012345" helpText="Find this in Meta Events Manager → Data Sources" />
            <Field label="Conversions API Access Token" value={metaToken} onChange={setMetaToken} placeholder="Your CAPI access token" type="password" helpText="Generate in Events Manager → Settings → Conversions API" />
          </div>
        )}
        {activeTab === 'tiktok' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a2e', marginBottom: '4px' }}>TikTok Events API</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Forward conversion events to TikTok for improved ad optimization.</p>
            <Field label="Pixel Code" value={ttPixelCode} onChange={setTtPixelCode} placeholder="e.g. CXXXXXXXXXXXXXXXXX" helpText="Find in TikTok Ads Manager → Events → Web Events" />
            <Field label="Access Token" value={ttToken} onChange={setTtToken} placeholder="Your Events API access token" type="password" helpText="Generate in TikTok Business Center → Settings" />
          </div>
        )}
        {activeTab === 'google' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a2e', marginBottom: '4px' }}>Google Ads Enhanced Conversions</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Upload conversions directly to Google Ads with gclid matching for maximum precision.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Client ID" value={gClientId} onChange={setGClientId} placeholder="OAuth Client ID" />
              <Field label="Client Secret" value={gClientSecret} onChange={setGClientSecret} placeholder="OAuth Client Secret" type="password" />
              <Field label="Refresh Token" value={gRefreshToken} onChange={setGRefreshToken} placeholder="OAuth Refresh Token" type="password" />
              <Field label="Developer Token" value={gDevToken} onChange={setGDevToken} placeholder="Developer Token" />
              <Field label="Customer ID" value={gCustomerId} onChange={setGCustomerId} placeholder="1234567890 (no dashes)" />
              <Field label="Conversion Action ID" value={gConversionId} onChange={setGConversionId} placeholder="Conversion Action ID" />
            </div>
          </div>
        )}
        {activeTab === 'applovin' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a2e', marginBottom: '4px' }}>AppLovin / Axon S2S</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Server-to-server postback for AppLovin ad attribution.</p>
            <Field label="SDK Key" value={alSdkKey} onChange={setAlSdkKey} placeholder="Your AppLovin SDK Key" helpText="Find in AppLovin Dashboard → Account → Keys" />
          </div>
        )}
      </div>

      {/* Save Button */}
      {message === 'success' && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span style={{ fontSize: '14px', color: '#065f46', fontWeight: 500 }}>Configuration saved! Tracking script injected into your store.</span>
        </div>
      )}
      {message === 'error' && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span style={{ fontSize: '14px', color: '#991b1b', fontWeight: 500 }}>Failed to save. Please try again.</span>
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={saving || !shop}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '10px',
          border: 'none',
          background: saving || !shop ? '#d1d5db' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          fontSize: '15px',
          fontWeight: 600,
          cursor: saving || !shop ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: saving || !shop ? 'none' : '0 4px 14px rgba(102, 126, 234, 0.4)',
        }}
      >
        {saving ? 'Saving...' : 'Save & Activate'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '16px' }}>
        PixelBridge v1.0 — Cookie Bridge technology for maximum conversion tracking accuracy
      </p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', helpText }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; helpText?: string;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1f2937',
          background: '#f9fafb',
          outline: 'none',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = '#667eea'}
        onBlur={e => e.target.style.borderColor = '#d1d5db'}
      />
      {helpText && <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', marginBottom: 0 }}>{helpText}</p>}
    </div>
  );
}
