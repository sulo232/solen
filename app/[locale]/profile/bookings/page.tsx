import { createServerSupabaseClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { BookingsList } from '@/components/booking';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('myBookings'),
    description: 'Manage and view your bookings',
  };
}

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'bookingsList' });
  const tNav = await getTranslations({ locale, namespace: 'navigation' });

  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile/bookings`)}`);
  }

  return (
    <div className="min-h-screen bg-[--base] dark:bg-s-dm-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[--raised] dark:bg-s-dm-surface border-b border-s-ink/[0.06] dark:border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/profile`}
              className="p-2 hover:bg-s-ink/[0.05] dark:hover:bg-white/[0.08] rounded-pill transition-colors"
              aria-label="Back"
            >
              <ChevronLeft size={24} className="text-s-ink dark:text-s-dm-text" />
            </Link>
            <h1 className="font-heading text-2xl font-semibold text-s-ink dark:text-s-dm-text">
              {tNav('bookings')}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingsList userId={user.id} />
      </div>
    </div>
  );
}
