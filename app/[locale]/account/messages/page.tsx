'use client';

import { MessagesPage } from '@/src/pages/account/MessagesPage';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <MessagesPage locale={locale} />;
}
