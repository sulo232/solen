'use client';

import { ProfilePage } from '@/src/pages/account/ProfilePage';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <ProfilePage locale={locale} />;
}
