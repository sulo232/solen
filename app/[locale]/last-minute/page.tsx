'use client';

import { LastMinutePage } from '@/src/pages/LastMinutePage';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <LastMinutePage locale={locale} />;
}
