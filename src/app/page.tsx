import { redirect } from 'next/navigation';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; handle?: string }>;
}) {
  const params = await searchParams;
  const shop = params.shop || params.handle || '';
  redirect(shop ? `/dashboard?shop=${shop}` : '/dashboard');
}
