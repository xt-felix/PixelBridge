import { NextRequest, NextResponse } from 'next/server';
import { getShopToken, getShopSubscription, saveShopSubscription } from '@/lib/shop';
import { createRecurringCharge, getRecurringCharge } from '@/lib/shopline-api';

export async function POST(req: NextRequest) {
  const { shopId } = await req.json();
  if (!shopId) {
    return NextResponse.json({ error: 'Missing shopId' }, { status: 400 });
  }

  const token = await getShopToken(shopId);
  if (!token) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  }

  const appUrl = process.env.SHOPLINE_APP_URL!;
  const result = await createRecurringCharge(shopId, token.accessToken, {
    name: 'Axon Pixel Pro',
    price: 4.99,
    returnUrl: `${appUrl}/api/billing?shop=${shopId}&action=confirm`,
  });

  if (!result) {
    return NextResponse.json({ error: 'Failed to create charge' }, { status: 500 });
  }

  return NextResponse.json({ confirmUrl: result.confirmUrl, chargeId: result.chargeId });
}

export async function GET(req: NextRequest) {
  const shopId = req.nextUrl.searchParams.get('shop') || '';
  const action = req.nextUrl.searchParams.get('action') || '';
  const chargeId = req.nextUrl.searchParams.get('charge_id') || '';

  if (action !== 'confirm' || !shopId) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const token = await getShopToken(shopId);
  if (!token || !chargeId) {
    return NextResponse.redirect(`${process.env.SHOPLINE_APP_URL}/dashboard?shop=${shopId}&billing=error`);
  }

  const charge = await getRecurringCharge(shopId, token.accessToken, chargeId);
  if (charge && charge.status === 'active') {
    await saveShopSubscription(shopId, { status: 'active', trialEnd: 0, chargeId });
  }

  return NextResponse.redirect(`${process.env.SHOPLINE_APP_URL}/dashboard?shop=${shopId}&billing=success`);
}
