'use client';

import { SignIn } from '@/src/components/auth/SignIn';
import { useSearchParams } from 'next/navigation';

interface Props {
  params: Promise<{ locale: string }>;
}

function LoginInner({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? `/${locale}`;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <SignIn redirectTo={redirectTo} locale={locale} />
    </div>
  );
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <LoginInner locale={locale} />;
}
