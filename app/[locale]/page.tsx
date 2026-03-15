'use client';

import { HomePage } from '@/src/pages/HomePage';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <HomePage locale={locale} />;
}
