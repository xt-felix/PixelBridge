import crypto from 'crypto';

export interface TrackEvent {
  name: string;
  eventId: string;
  timestamp: number;
  value?: number;
  currency?: string;
  orderId?: string;
  productIds?: string[];
  quantity?: number;
  ip: string;
  ua: string;
  url: string;
  referrer?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  customerId?: string;
  fbp?: string;
  fbc?: string;
  gclid?: string;
  ttclid?: string;
  axwrt?: string;
}

export interface MetaConfig {
  pixelId: string;
  accessToken: string;
}

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  developerToken: string;
  customerId: string;
  conversionActionId: string;
}

export interface TikTokConfig {
  pixelCode: string;
  accessToken: string;
}

export interface AppLovinConfig {
  sdkKey: string;
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '');
}

function mapToMetaEvent(event: string): string {
  const map: Record<string, string> = {
    page_view: 'PageView',
    view_item: 'ViewContent',
    add_to_cart: 'AddToCart',
    begin_checkout: 'InitiateCheckout',
    purchase: 'Purchase',
  };
  return map[event] || event;
}

export async function sendToMeta(
  event: TrackEvent,
  bridgeData: any,
  config: MetaConfig
) {
  const userData: Record<string, any> = {
    client_ip_address: event.ip,
    client_user_agent: event.ua,
  };

  if (event.email) userData.em = [sha256(event.email)];
  if (event.phone) userData.ph = [sha256(normalizePhone(event.phone))];
  if (event.firstName) userData.fn = [sha256(event.firstName)];
  if (event.lastName) userData.ln = [sha256(event.lastName)];
  if (event.city) userData.ct = [sha256(event.city)];
  if (event.state) userData.st = [sha256(event.state)];
  if (event.zip) userData.zp = [sha256(event.zip)];
  if (event.country) userData.country = [sha256(event.country.toLowerCase())];

  if (bridgeData?.fbp) userData.fbp = bridgeData.fbp;
  if (bridgeData?.fbc) userData.fbc = bridgeData.fbc;
  if (event.fbp) userData.fbp = event.fbp;
  if (event.fbc) userData.fbc = event.fbc;
  if (event.customerId) userData.external_id = [sha256(event.customerId)];

  const payload = {
    data: [{
      event_name: mapToMetaEvent(event.name),
      event_time: Math.floor(event.timestamp / 1000),
      event_id: event.eventId,
      event_source_url: event.url,
      action_source: 'website',
      user_data: userData,
      custom_data: {
        value: event.value,
        currency: event.currency,
        content_ids: event.productIds,
        content_type: 'product',
        num_items: event.quantity,
        order_id: event.orderId,
      },
    }],
  };

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${config.pixelId}/events?access_token=${config.accessToken}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
  );
  return res.json();
}

export async function sendToGoogle(
  event: TrackEvent,
  bridgeData: any,
  config: GoogleConfig
) {
  const accessToken = await refreshGoogleToken(config);

  const userIdentifiers: any[] = [];
  if (event.email) userIdentifiers.push({ hashedEmail: sha256(event.email) });
  if (event.phone) userIdentifiers.push({ hashedPhoneNumber: sha256(normalizePhone(event.phone)) });
  if (event.firstName && event.lastName) {
    userIdentifiers.push({
      addressInfo: {
        hashedFirstName: sha256(event.firstName),
        hashedLastName: sha256(event.lastName),
        countryCode: event.country || 'US',
        postalCode: event.zip || '',
      },
    });
  }

  const conversion: any = {
    conversionAction: `customers/${config.customerId}/conversionActions/${config.conversionActionId}`,
    conversionDateTime: formatGoogleDateTime(event.timestamp),
    conversionValue: event.value,
    currencyCode: event.currency,
    orderId: event.orderId,
  };

  if (bridgeData?.gclid || event.gclid) {
    conversion.gclid = bridgeData?.gclid || event.gclid;
  } else if (userIdentifiers.length > 0) {
    conversion.userIdentifiers = userIdentifiers;
  }

  const res = await fetch(
    `https://googleads.googleapis.com/v17/customers/${config.customerId}:uploadClickConversions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': config.developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversions: [conversion], partialFailure: true }),
    }
  );
  return res.json();
}

async function refreshGoogleToken(config: GoogleConfig): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

function formatGoogleDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const mm = String(Math.abs(offset) % 60).padStart(2, '0');
  return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '') + `${sign}${hh}:${mm}`;
}

function mapToTikTokEvent(event: string): string {
  const map: Record<string, string> = {
    page_view: 'Pageview',
    view_item: 'ViewContent',
    add_to_cart: 'AddToCart',
    begin_checkout: 'InitiateCheckout',
    purchase: 'CompletePayment',
  };
  return map[event] || event;
}

export async function sendToTikTok(
  event: TrackEvent,
  bridgeData: any,
  config: TikTokConfig
) {
  const userData: Record<string, any> = {
    ip: event.ip,
    user_agent: event.ua,
  };

  if (bridgeData?.ttclid) userData.ttclid = bridgeData.ttclid;
  if (event.ttclid) userData.ttclid = event.ttclid;
  if (event.email) userData.email = sha256(event.email);
  if (event.phone) userData.phone = sha256(normalizePhone(event.phone));
  if (event.customerId) userData.external_id = sha256(event.customerId);

  const payload = {
    event_source: 'web',
    event_source_id: config.pixelCode,
    data: [{
      event: mapToTikTokEvent(event.name),
      event_time: Math.floor(event.timestamp / 1000),
      event_id: event.eventId,
      user: userData,
      properties: {
        value: event.value,
        currency: event.currency,
        contents: event.productIds?.map(id => ({
          content_id: id,
          content_type: 'product',
          quantity: 1,
          price: event.value,
        })),
        content_type: 'product',
        order_id: event.orderId,
      },
      page: { url: event.url, referrer: event.referrer },
    }],
  };

  const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
    method: 'POST',
    headers: { 'Access-Token': config.accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function sendToAppLovin(
  event: TrackEvent,
  bridgeData: any,
  config: AppLovinConfig
) {
  const payload: Record<string, any> = {
    sdk_key: config.sdkKey,
    event_type: event.name,
    event_id: event.eventId,
    timestamp: Math.floor(event.timestamp / 1000),
    platform: 'web',
    user_id: event.customerId,
  };

  if (event.value) {
    payload.revenue = event.value;
    payload.currency = event.currency;
  }

  if (bridgeData?.axwrt) payload.axon_id = bridgeData.axwrt;
  if (event.axwrt) payload.axon_id = event.axwrt;

  const res = await fetch('https://s2s.applovin.com/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}
