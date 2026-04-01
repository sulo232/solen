import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase';
import { BookingProvider } from '@/lib/booking-context';
import { BookingWizard } from '@/components/booking';
import type { StaffMember } from '@/lib/types';

interface BookingSalonPageProps {
  params: { locale: string; slug: string };
}

export async function generateMetadata({
  params: { locale, slug },
}: BookingSalonPageProps) {
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('booking'),
    description: t('bookingDescription'),
  };
}

export default async function BookingSalonPage({
  params: { locale, slug },
}: BookingSalonPageProps) {
  const supabase = createServerClient();
  const t = await getTranslations({ locale, namespace: 'booking' });

  // Fetch salon
  const { data: salon, error: salonError } = await supabase
    .from('salons')
    .select(
      `id, name, slug, description_de, description_en, address, latitude, longitude,
      cover_photo_url, average_rating, review_count, cancellation_window_hours`
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (salonError || !salon) {
    notFound();
  }

  // Fetch salon services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select(
      'id, name_de, name_en, category, duration_minutes, price, is_active'
    )
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .order('category, name_de');

  if (servicesError || !services) {
    throw new Error('Failed to fetch services');
  }

  // Fetch staff members
  const { data: staffRaw, error: staffError } = await supabase
    .from('staff_members')
    .select(
      `id, name, avatar_url, specialties, is_active, average_rating`
    )
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .order('name');

  if (staffError || !staffRaw) {
    throw new Error('Failed to fetch staff');
  }

  const staff = staffRaw as StaffMember[];

  return (
    <BookingProvider salonId={salon.id}>
      <div className="min-h-screen bg-[--base] dark:bg-s-dm-bg">
        {/* Header with salon name */}
        <header className="sticky top-0 z-40 border-b border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="font-display font-bold text-xl text-s-ink dark:text-s-dm-text">
              {t('bookingAt', { salon: salon.name })}
            </h1>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-2xl mx-auto px-4 py-6">
          <BookingWizard services={services} staffList={staff} salon={salon} />
        </main>
      </div>
    </BookingProvider>
  );
}
