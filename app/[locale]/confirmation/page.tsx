import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { buildAlternates } from '@/lib/seo';
import { formatCurrency } from '@/lib/format-currency';
import { computeVat } from '@/lib/vat';
import { verifyAccessToken } from '@/lib/bookings/guest-access';
import BookingConfirmation from '@/components-legacy/booking/BookingConfirmation';
import { localizedField } from "@/lib/i18n/localized-field";

interface ConfirmationPageProps {
  params: Promise<{ locale: string }>;
  // SP-1: PayConfirmStep forwards `access_token` + `ref` for a guest booking (just
  // `booking_id` for a logged-in customer). The raw token authorizes the guest read here
  // (verified against the stored hash) and builds the "save your access link" link.
  searchParams: Promise<{ booking_id?: string; access_token?: string; ref?: string }>;
}

// The fields the confirmation screen reads, selected identically on both the RLS (cookie)
// and the service-role (guest) path.
const BOOKING_SELECT = `id, salon_id, service_id, staff_member_id, starts_at, ends_at,
  price_paid, remaining_at_salon, paid_amount, status, payment_status, payment_intent_id, reference_code, paid_via, user_id, access_token_hash, access_token_expires_at, vat_rate,
  salons(id, name, slug, address, phone, cover_photo_url, vat_number),
  services(id, name_de, name_en, name_fr, name_it, duration_minutes, price),
  staff_members(name)`;

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
  const { booking_id, access_token, ref } = await searchParams;

  if (!booking_id) {
    notFound();
  }

  // Two read paths, because guest bookings (user_id IS NULL) are deny-by-default under RLS
  // and reachable only via the token-gated service-role path (see
  // supabase/migrations/20260601_sp1_bookings_guest_rls.sql + lib/bookings/authorize.ts):
  //   - logged-in customer / salon owner -> cookie client, RLS `bookings_select_own`.
  //   - guest (raw access_token in the URL) -> service-role read, then verifyAccessToken
  //     against the stored SHA-256 hash. We never trust reference_code alone, and never log
  //     the raw token.
  let booking: any = null;
  let isGuest = false;

  if (access_token) {
    const admin = createAdminSupabaseClient();
    const { data: row } = await admin
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('id', booking_id)
      .maybeSingle();

    if (
      row &&
      !row.user_id &&
      verifyAccessToken(
        access_token,
        (row as any).access_token_hash ?? null,
        (row as any).access_token_expires_at ?? null,
      )
    ) {
      booking = row;
      isGuest = true;
    }
  }

  if (!booking) {
    // Logged-in customer / salon owner: RLS does the entitlement check.
    const supabase = await createServerSupabaseClient();
    const { data: row, error } = await supabase
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('id', booking_id)
      .single();

    if (error || !row) {
      console.error('[ConfirmationPage] Booking fetch error:', error);
      notFound();
    }
    booking = row;
    isGuest = !row.user_id;
  }

  const localeCode =
    locale === 'de' ? 'de-CH' : locale === 'fr' ? 'fr-CH' : locale === 'it' ? 'it-CH' : 'en-CH';

  const salon = (Array.isArray(booking.salons) ? booking.salons[0] : booking.salons) as any;
  const service = (Array.isArray(booking.services) ? booking.services[0] : booking.services) as any;
  const staff = (Array.isArray(booking.staff_members)
    ? booking.staff_members[0]
    : booking.staff_members) as any;

  const serviceName =
    localizedField(service as Record<string, unknown> | null, 'name', locale);

  // Guest access link: the REAL guest-lookup route (?code=&t=) that exchanges the raw token
  // once for an httpOnly cookie. Only build it when we carry both the reference_code and the
  // raw token from the booking POST handoff.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.solen.ch";
  const accessLink =
    isGuest && booking.reference_code && access_token
      ? `${siteUrl}/${locale}/booking/lookup?code=${encodeURIComponent(
          booking.reference_code,
        )}&t=${encodeURIComponent(access_token)}`
      : null;

  // VAT/MWST receipt breakdown. bookings.vat_rate is the rate actually applied at payment
  // (>0 ⇒ a registered salon charged VAT; 0/NULL ⇒ none — non-registered/Kleinunternehmen).
  // Recompute net + VAT from the SAME gross we display (price_paid CHF → Rappen) so Netto + MWST
  // sum to the shown total exactly (computeVat derives VAT by subtraction). The component only
  // renders the breakdown when the payment actually settled (payment_status 'paid').
  const vatRateApplied = Number(booking.vat_rate ?? 0);
  const grossRappen = Math.round(Number(booking.price_paid ?? 0) * 100);
  const vat =
    vatRateApplied > 0 && grossRappen > 0
      ? computeVat(grossRappen, { registered: true, ratePercent: vatRateApplied })
      : { netRappen: 0, vatRappen: 0, ratePercent: 0 };

  return (
    <BookingConfirmation
      referenceCode={booking.reference_code ?? ref ?? null}
      salonName={salon?.name || ''}
      salonSlug={salon?.slug || ''}
      salonAddress={salon?.address || ''}
      salonCoverUrl={salon?.cover_photo_url || null}
      serviceName={serviceName}
      servicePrice={service?.price ?? null}
      staffName={staff?.name || null}
      startsAt={booking.starts_at}
      durationMinutes={service?.duration_minutes ?? null}
      pricePaid={booking.price_paid}
      priceLabel={formatCurrency(booking.price_paid, localeCode)}
      paidVia={booking.paid_via ?? null}
      status={booking.status ?? null}
      paymentStatus={booking.payment_status ?? null}
      paidNowLabel={formatCurrency(Number((booking as { paid_amount?: number | null }).paid_amount ?? 0) / 100, localeCode)}
      remainingAtSalonLabel={(booking as { remaining_at_salon?: number | null }).remaining_at_salon != null ? formatCurrency(Number((booking as { remaining_at_salon?: number | null }).remaining_at_salon), localeCode) : null}
      hasOnlinePayment={Boolean((booking as { payment_intent_id?: string | null }).payment_intent_id)}
      isGuest={isGuest}
      accessLink={accessLink}
      accessToken={isGuest ? (access_token ?? null) : null}
      contactEmail={null}
      vatRate={vat.ratePercent}
      netLabel={formatCurrency(vat.netRappen / 100, localeCode)}
      vatLabel={formatCurrency(vat.vatRappen / 100, localeCode)}
      salonVatNumber={salon?.vat_number ?? null}
      bookingId={booking.id}
      salonId={booking.salon_id ?? salon?.id ?? ''}
      serviceId={booking.service_id ?? ''}
      staffId={booking.staff_member_id ?? null}
      endsAt={booking.ends_at}
    />
  );
}
