import crypto from 'crypto';

function createHmacSign(appSecret: string, message: string): string {
  return crypto.createHmac('sha256', appSecret).update(message).digest('hex');
}

function getBaseUrl(shopHandle: string): string {
  return `https://${shopHandle}.myshopline.com`;
}

export async function exchangeCodeForToken(shopHandle: string, code: string): Promise<string | null> {
  const appKey = process.env.SHOPLINE_APP_KEY!;
  const appSecret = process.env.SHOPLINE_APP_SECRET!;
  const timestamp = Date.now().toString();
  const sign = createHmacSign(appSecret, `${JSON.stringify({ code })}${timestamp}`);

  const res = await fetch(`${getBaseUrl(shopHandle)}/admin/oauth/token/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      appkey: appKey,
      sign,
      timestamp,
    },
    body: JSON.stringify({ code }),
  });

  const data = await res.json();
  return data.data?.accessToken || data.data?.access_token || null;
}

export async function createScriptTag(shopHandle: string, accessToken: string, src: string): Promise<string | null> {
  const res = await fetch(
    `${getBaseUrl(shopHandle)}/admin/openapi/v20250601/store/script_tags.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script_tag: { event: 'onload', src, display_scope: 'all' },
      }),
    }
  );
  const data = await res.json();
  return data.script_tag?.id || null;
}

export async function deleteScriptTag(shopHandle: string, accessToken: string, scriptTagId: string): Promise<void> {
  await fetch(
    `${getBaseUrl(shopHandle)}/admin/openapi/v20250601/store/script_tags/${scriptTagId}.json`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
}

export async function registerWebhook(shopHandle: string, accessToken: string, topic: string, address: string): Promise<void> {
  await fetch(`${getBaseUrl(shopHandle)}/admin/openapi/v20250601/webhooks.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      webhook: { topic, address, format: 'json' },
    }),
  });
}

export async function createRecurringCharge(
  shopHandle: string,
  accessToken: string,
  opts: { name: string; price: number; trialDays?: number; returnUrl: string }
): Promise<{ confirmUrl: string; chargeId: string } | null> {
  const res = await fetch(
    `${getBaseUrl(shopHandle)}/admin/openapi/v20250601/recurring_application_charges.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recurring_application_charge: {
          name: opts.name,
          price: opts.price,
          trial_days: opts.trialDays || 0,
          return_url: opts.returnUrl,
        },
      }),
    }
  );
  const data = await res.json();
  const charge = data.recurring_application_charge;
  if (!charge) return null;
  return { confirmUrl: charge.confirmation_url, chargeId: charge.id };
}

export async function getRecurringCharge(
  shopHandle: string,
  accessToken: string,
  chargeId: string
): Promise<{ status: string } | null> {
  const res = await fetch(
    `${getBaseUrl(shopHandle)}/admin/openapi/v20250601/recurring_application_charges/${chargeId}.json`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await res.json();
  return data.recurring_application_charge || null;
}

export function buildOAuthUrl(shopHandle: string): string {
  const appKey = process.env.SHOPLINE_APP_KEY!;
  const appUrl = process.env.SHOPLINE_APP_URL!;
  const scopes = 'write_script_tags,read_orders';
  const redirectUri = `${appUrl}/api/auth/callback`;
  return `${getBaseUrl(shopHandle)}/admin/oauth-web/#/oauth/authorize?appKey=${appKey}&responseType=code&scope=${scopes}&redirectUri=${encodeURIComponent(redirectUri)}`;
}
