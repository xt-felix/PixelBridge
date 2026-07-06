import { NextRequest, NextResponse } from 'next/server';
import { getShopConfig, getShopSubscription } from '@/lib/shop';
import { isSubscriptionActive } from '@/lib/subscription';
import { buildPixelScript } from '@/pixel/axon-pixel-template';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const sub = await getShopSubscription(shopId);

  if (!isSubscriptionActive(sub)) {
    return new NextResponse('// inactive', {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  const config = await getShopConfig(shopId);
  if (!config || !config.pixelKey) {
    return new NextResponse('// not configured', {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  const appUrl = process.env.SHOPLINE_APP_URL!;
  const script = buildPixelScript({
    pixelKey: config.pixelKey,
    categoryId: config.categoryId,
    statsUrl: `${appUrl}/api/stats?shop=${shopId}`,
  });

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
