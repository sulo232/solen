'use client';

import { SalonProfilePage } from '@/src/pages/SalonProfilePage';
import { useSearchParams } from 'next/navigation';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

function SalonPageInner({ locale, slug }: { locale: string; slug: string }) {
  const searchParams = useSearchParams();
  return (
    <SalonProfilePage
      slug={slug}
      locale={locale}
      preSelectedServiceId={searchParams.get('service') ?? undefined}
      preSelectedSlotId={searchParams.get('slot') ?? undefined}
    />
  );
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  return <SalonPageInner locale={locale} slug={slug} />;
}
