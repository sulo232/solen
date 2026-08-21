import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createAdminSupabaseClient, getSessionUser } from '@/lib/supabase';
import { BookingProvider } from '@/lib/booking-context';
import { BookingWizard, EmptyServicesState } from '@/components-legacy/booking';
import type { StaffMember, Salon } from '@/lib/types';

interface BookingSalonPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ staff?: string; service?: string; services?: string; start?: string; date?: string; note?: string; bundle?: string }>;
}

// GAP #5 punch (round 2, 2026-07-18): a NaN-only Date() check does NOT catch day-of-month
// overflow, JS silently normalizes "2026-02-30" -> "2026-03-02" instead of throwing, so a
// garbage ?date= would prefill the WRONG date rather than falling back to no-prefill. This
// round-trips the y/m/d components through a LOCAL-time Date (no UTC shift) and requires
// them to read back identically, the only way to catch an auto-normalized invalid date.
function isRealCalendarDate(ymd: string): boolean {
  const [y, m, d] = ymd.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d;
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
  searchParams,
}: BookingSalonPageProps) {
  const { locale, slug } = await params;
  const { staff: staffParam, service: serviceParam, services: servicesParam, start: startParam, date: dateParam, note: noteParam, bundle: bundleParam } = await searchParams;
  const supabase = createAdminSupabaseClient();
  const t = await getTranslations({ locale, namespace: 'booking' });

  // SP-1: surface logged-in state to the client so PayConfirmStep can show the guest form to
  // logged-out visitors. The page reads the session server-side (no network call) and passes a
  // single boolean down. The booking data above stays on the admin client (it's public salon data).
  const { user } = await getSessionUser();
  const isLoggedIn = Boolean(user);

  // Fetch salon
  const { data: salon, error: salonError } = await supabase
    .from('salons')
    .select(
      `id, name, slug, description_de, description_en, address, latitude, longitude,
      cover_photo_url, average_rating, review_count, cancellation_window_hours,
      payment_mode, deposit_percent, phone, accepts_online_payment, vat_registered, vat_rate`
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (salonError || !salon) {
    notFound();
  }

  // Owner 2026-08-21: the gift-voucher code box was showing for every salon, including salons
  // that never issued a voucher, so most people who typed a code just hit an error. Hide the box
  // unless this salon actually has at least one redeemable voucher. "Redeemable" is functionally
  // equivalent to app/api/vouchers/validate/route.ts: remaining_amount not null (null means the
  // purchase was never paid), not yet redeemed, and not expired. The one difference: this query
  // also requires remaining_amount above zero, which validate never tests directly. That is safe
  // today because the redeem UPDATE (supabase/migrations/20260714160410_fix_redeem_credit_voucher_advisory_lock.sql)
  // sets redeemed_at in the same atomic statement whenever remaining_amount drops to zero or below,
  // so remaining_amount = 0 with redeemed_at still null cannot occur. Head-only count query, no
  // rows returned.
  const { count: redeemableVoucherCount, error: voucherCountError } = await supabase
    .from('vouchers')
    .select('id', { head: true, count: 'exact' })
    .eq('salon_id', salon.id)
    .not('remaining_amount', 'is', null)
    .gt('remaining_amount', 0)
    .is('redeemed_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .limit(1);

  if (voucherCountError) {
    console.error("[BookingSalonPage] voucher availability check failed:", voucherCountError);
  }
  const salonHasRedeemableVoucher = voucherCountError ? false : (redeemableVoucherCount ?? 0) > 0;

  // Fetch salon services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select(
      'id, name_de, name_en, category, subcategory, duration_minutes, price, is_active, description_de, description_en, suitable_gender'
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
      // B19 (owner 2026-07-09, restore "view profile" + reviews in the booking
      // stylist picker): review_count + bio were missing here, so the picker's
      // rating (which needs BOTH average_rating and review_count) and the new
      // read-only profile sheet's bio were always silently empty. Added.
      `id, name, avatar_url, specialties, is_active, average_rating, review_count, bio, languages`
    )
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .order('name');

  if (staffError || !staffRaw) {
    throw new Error('Failed to fetch staff');
  }

  const staff = staffRaw as StaffMember[];

  // Preselect a stylist when arriving from the PDP "Team" section (?staff=<id>).
  // Validated against the real staff list so a bogus param is ignored.
  const initialStaffId =
    staffParam && staff.some((s) => s.id === staffParam) ? staffParam : undefined;

  // GAP #5 (2026-07-18): preselect the DATE only (never a time) when arriving from a
  // search result / PDP link that carried ?date=YYYY-MM-DD. Strict format check plus a
  // real-date check plus a not-in-the-past check; anything that fails just falls back to
  // no prefill (never crashes the page). Deliberately date-only, not a fabricated ?start=
  // (which would also seed a fake time), so the user still picks a real slot.
  const todayYmd = new Date().toISOString().slice(0, 10);
  const initialDate =
    dateParam &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateParam) &&
    isRealCalendarDate(dateParam) &&
    dateParam >= todayYmd
      ? dateParam
      : undefined;

  // V3-D379: preselect a service when arriving from a search/category card slot
  // pill (?service=<id>) — validated against the real service list, so it lands
  // in the booking cart instead of dumping the user on an empty step 1.
  const matchedService = serviceParam
    ? (services as {
        id: string;
        name_de?: string | null;
        name_en?: string | null;
        price?: number | null;
        duration_minutes?: number | null;
      }[]).find((s) => s.id === serviceParam)
    : undefined;
  const initialService = matchedService
    ? {
        id: matchedService.id,
        name_de: matchedService.name_de ?? "",
        name_en: matchedService.name_en ?? matchedService.name_de ?? "",
        price: matchedService.price ?? 0,
        duration_minutes: matchedService.duration_minutes ?? 0,
      }
    : undefined;

  // Multi-select handoff from the PDP "Alle ansehen" sheet (?services=<csv>): seed the cart with
  // every chosen service (validated against the real list). Falls back to the single ?service= above.
  const svcList = services as {
    id: string; name_de?: string | null; name_en?: string | null;
    price?: number | null; duration_minutes?: number | null;
  }[];
  const initialServices = servicesParam
    ? servicesParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => svcList.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
        .map((s) => ({
          id: s.id,
          name_de: s.name_de ?? "",
          name_en: s.name_en ?? s.name_de ?? "",
          price: s.price ?? 0,
          duration_minutes: s.duration_minutes ?? 0,
        }))
    : undefined;

  // Phase 3 data: stylist↔service map (#6 filter) + service add-ons (#7 expand).
  // Enhancement data — degrade gracefully, never block booking if absent.
  const staffIds = staff.map((s) => s.id);
  const serviceIds = (services as { id: string }[]).map((s) => s.id);
  const staffServices = staffIds.length
    ? (
        await supabase
          .from('staff_services')
          .select('staff_member_id, service_id')
          .in('staff_member_id', staffIds)
      ).data ?? []
    : [];
  const serviceAddons = serviceIds.length
    ? (
        await supabase
          .from('service_addons')
          .select('service_id, addon_service_id, sort_order')
          .in('service_id', serviceIds)
      ).data ?? []
    : [];
  const serviceOptions = serviceIds.length
    ? (
        await supabase
          .from('service_options')
          .select(
            'id, service_id, name_de, name_en, price, duration_minutes, sort_order'
          )
          .in('service_id', serviceIds)
      ).data ?? []
    : [];

  // Owner 2026-06-24: if BOTH ?staff and ?service were deep-linked, make sure the stylist actually OFFERS that
  // service, else drop the stylist preselect (a mismatched stylist must never seed). Fallback matches StaffStep:
  // a stylist with NO service mappings does everything, so only drop one that HAS mappings missing the service.
  let safeStaffId = initialStaffId;
  if (initialStaffId && initialService) {
    const sm = staffServices.filter((m) => m.staff_member_id === initialStaffId);
    if (sm.length > 0 && !sm.some((m) => m.service_id === initialService.id)) safeStaffId = undefined;
  }

  // A5 BUG-1 (2026-07-03): the bundle card links with ?bundle=<id>; carry it into the wizard so
  // PayConfirmStep's POST /api/bookings body includes bundle_id (the server then recomputes the
  // discounted bundle price). Validate it is a REAL ACTIVE bundle for THIS salon (same style as the
  // service/staff validation above); an invalid/foreign/inactive id is simply ignored (no crash),
  // and the server's loadPricedBundle guard is the fail-closed backstop regardless.
  let initialBundleId: string | undefined;
  if (bundleParam) {
    const { data: bundleRow } = await supabase
      .from('service_bundles')
      .select('id')
      .eq('id', bundleParam)
      .eq('salon_id', salon.id)
      .eq('is_active', true)
      .maybeSingle();
    if (bundleRow) initialBundleId = bundleRow.id as string;
  }

  // No bookable services (onboarded-but-empty, or all deactivated) → the wizard would dump
  // the user on a dead step 1. Show the empty state with real paths forward instead (audit #8).
  const hasServices = Array.isArray(services) && services.length > 0;
  const salonAny = salon as unknown as { phone: string | null; cover_photo_url: string | null; average_rating: number | null; review_count: number | null; address: string | null };
  // is_active is nullable in the DB but the query already filters .eq('is_active', true), so every
  // returned row genuinely has it true; coalesce to satisfy BookingWizard's Service (non-null) type.
  const bookingServices = services.map((s) => ({ ...s, is_active: s.is_active ?? true }));

  return (
    <BookingProvider salonId={salon.id} initialStaffId={safeStaffId} initialService={initialService} initialServices={initialServices} initialStart={startParam} initialDate={initialDate} initialNote={noteParam} initialBundleId={initialBundleId}>
      {/* Mockup 20 (owner-approved 2026-06-11): Fresha bones — sunken body,
          no salon-name header bar; nav (back + X) + the big task title live
          inside the wizard. */}
      {/* mockup-ok: owner 2026-07-18 live fix + approved liftup-booking-services-tiered mockup */}
      <div className="min-h-screen bg-white">
        <main className="max-w-2xl mx-auto px-4 pt-3 pb-6">
          {hasServices ? (
            <BookingWizard
              services={bookingServices}
              staffList={staff}
              salon={salon as unknown as Salon}
              staffServices={staffServices}
              serviceAddons={serviceAddons}
              serviceOptions={serviceOptions}
              isLoggedIn={isLoggedIn}
              salonHasRedeemableVoucher={salonHasRedeemableVoucher}
            />
          ) : (
            <EmptyServicesState
              locale={locale}
              slug={slug}
              salonName={salon.name}
              coverPhotoUrl={salonAny.cover_photo_url}
              rating={salonAny.average_rating}
              reviewCount={salonAny.review_count}
              address={salonAny.address}
              phone={salonAny.phone}
            />
          )}
        </main>
      </div>
    </BookingProvider>
  );
}
