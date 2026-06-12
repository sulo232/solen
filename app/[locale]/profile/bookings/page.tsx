import { createServerSupabaseClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { BookingsList } from '@/components-legacy/booking';
import { getTranslations } from 'next-intl/server';
import { buildAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const alternates = buildAlternates('profile/bookings', locale);
  return {
    title: t('myBookings'),
    description: 'Manage and view your bookings',
    alternates,
  };
}

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile/bookings`)}`);
  }

  return (
    <div className="min-h-screen bg-[--base]">
      {/* Title moved beside the global back tile (Header deepPageTitle); the old
          stacked sticky sub-bar doubled the chrome under the sticky site header. */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingsList userId={user.id} />
      </div>
    </div>
  );
}
