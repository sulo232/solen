import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { buildAlternates } from '@/lib/seo';
import { CheckCircle, Calendar, Share2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/format-currency';

interface ConfirmationPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ booking_id?: string }>;
}

export async function generateMetadata({
  params,
}: ConfirmationPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ui.successPage' });
  const alternates = buildAlternates('confirmation', locale);
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates,
  };
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const { locale } = await params;
  const { booking_id } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'ui.successPage' });

  if (!booking_id) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();

  // Fetch booking with salon and service details
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      `id, salon_id, service_id, starts_at, ends_at, price_paid, status,
       salons(id, name, slug, address, phone),
       services(id, name_de, name_en, duration_minutes)`
    )
    .eq('id', booking_id)
    .single();

  if (error || !booking) {
    console.error('[ConfirmationPage] Booking fetch error:', error);
    notFound();
  }

  const startDate = new Date(booking.starts_at);

  const formatDate = (date: Date) => {
    const formatter = new Intl.DateTimeFormat(locale === 'de' ? 'de-CH' : locale === 'fr' ? 'fr-CH' : locale === 'it' ? 'it-CH' : 'en-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return formatter.format(date);
  };

  const getServiceName = (): string => {
    const service = Array.isArray(booking.services) ? (booking.services[0] as any) : (booking.services as any);
    if (locale === 'en' && service?.name_en) {
      return service.name_en;
    }
    return service?.name_de || service?.name_en || '';
  };

  return (
    <div className="min-h-screen bg-[--base] dark:bg-s-dm-bg">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Success animation */}
        <div className="flex justify-center mb-8">
          <div className="animate-[scale_.3s_ease-out_forwards] w-20 h-20 rounded-full bg-s-coral flex items-center justify-center">
            <CheckCircle size={40} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center font-display font-bold text-3xl text-s-ink dark:text-s-dm-text mb-2">
          {t('title')}
        </h1>
        <p className="text-center text-s-ink/60 dark:text-s-dm-text/60 mb-8">
          {t('subtitle')}
        </p>

        {/* Booking summary card */}
        <div className="border border-s-ink/[0.06] dark:border-white/[0.08] rounded-[16px] bg-[--raised] dark:bg-s-dm-surface p-6 space-y-6 mb-8">
          {/* Salon */}
          <div>
            <p className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
              {t('salon')}
            </p>
            <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">
              {(Array.isArray(booking.salons) ? (booking.salons[0] as any)?.name : (booking.salons as any)?.name) || ''}
            </h2>
            <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60">
              {(Array.isArray(booking.salons) ? (booking.salons[0] as any)?.address : (booking.salons as any)?.address) || ''}
            </p>
          </div>

          {/* Service */}
          <div>
            <p className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
              {t('service')}
            </p>
            <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">
              {getServiceName()}
            </p>
          </div>

          {/* Date and time */}
          <div>
            <p className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
              {t('dateTime')}
            </p>
            <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">
              {formatDate(startDate)}
            </p>
          </div>

          {/* Price divider */}
          <div className="pt-4 border-t border-s-ink/[0.06] dark:border-white/[0.08]">
            <div className="flex justify-between items-center">
              <span className="font-heading font-bold text-s-ink dark:text-s-dm-text">
                {t('total')}
              </span>
              <span className="data-text font-bold text-2xl text-s-ink dark:text-s-dm-text">
                {formatCurrency(booking.price_paid, locale === 'de' ? 'de-CH' : locale === 'fr' ? 'fr-CH' : locale === 'it' ? 'it-CH' : 'en-CH')}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 mb-8">
          {/* Add to Calendar */}
          <button
            className="w-full flex items-center justify-center gap-2 py-4 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150"
            aria-label={t('addToCalendar')}
          >
            <Calendar size={16} />
            {t('addToCalendar')}
          </button>

          {/* Share Booking */}
          <button
            className="w-full flex items-center justify-center gap-2 py-4 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] dark:hover:bg-white/[0.02] active:scale-[0.97] transition-[transform,filter] duration-150"
            aria-label={t('shareBooking')}
          >
            <Share2 size={16} />
            {t('shareBooking')}
          </button>

          {/* Rebook */}
          <Link
            href={`/${locale}/salon/${(Array.isArray(booking.salons) ? (booking.salons[0] as any)?.slug : (booking.salons as any)?.slug) || ''}`}
            className="block text-center py-4 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] dark:hover:bg-white/[0.02] active:scale-[0.97] transition-[transform,filter] duration-150"
            aria-label={t('rebook')}
          >
            {t('rebook')}
          </Link>
        </div>

        {/* Secondary CTA — continue exploring */}
        <div className="text-center">
          <Link
            href={`/${locale}`}
            className="inline text-s-coral hover:text-s-coral/80 transition-colors text-sm font-heading font-bold"
          >
            {t('continueExploring')}
          </Link>
        </div>
      </main>
    </div>
  );
}
