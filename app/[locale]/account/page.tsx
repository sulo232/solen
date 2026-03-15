'use client';

import { AccountPage } from '@/src/pages/account/AccountPage';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <AccountPage locale={locale} />;
}
