import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import { BookingProvider } from '@/lib/booking-context';
import { BookingWizard } from '@/components/booking';
import type { StaffMember, Salon } from '@/lib/types';

interface BookingSalonPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: BookingSalonPageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  return {
    title: 'Book your appointment | Solen',
    description: 'Secure your appointment with just a few clicks.',
  };
}

export default async function BookingSalonPage({
  params,
}: BookingSalonPageProps) {
  const { locale, slug } = await params;
  const supabase = createAdminSupabaseClient();
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
      <div className="min-h-screen bg-[--base]">
        {/* Header with salon name */}
        <header className="sticky top-0 z-40 border-b border-s-ink/[0.06] bg-[--raised]">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="font-display font-bold text-xl text-s-ink">
              {t('bookingAt', { salon: salon.name })}
            </h1>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-2xl mx-auto px-4 py-6">
          <BookingWizard services={services} staffList={staff} salon={salon as Salon} />
        </main>
      </div>
    </BookingProvider>
  );
}
