import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createAdminSupabaseClient, getSessionUser } from '@/lib/supabase';
import { BookingProvider } from '@/lib/booking-context';
import { BookingWizard, EmptyServicesState } from '@/components-legacy/booking';
import BookingExitButton from '@/components-legacy/booking/BookingExitButton';
import BookingHeaderTitle from '@/components-legacy/booking/BookingHeaderTitle';
import type { StaffMember, Salon } from '@/lib/types';

interface BookingSalonPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ staff?: string; service?: string; services?: string; start?: string }>;
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
  const { staff: staffParam, service: serviceParam, services: servicesParam, start: startParam } = await searchParams;
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
      payment_mode, deposit_percent, phone`
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
      `id, name, avatar_url, specialties, is_active, average_rating, languages`
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

  // No bookable services (onboarded-but-empty, or all deactivated) → the wizard would dump
  // the user on a dead step 1. Show the empty state with real paths forward instead (audit #8).
  const hasServices = Array.isArray(services) && services.length > 0;
  const salonAny = salon as unknown as { phone: string | null; cover_photo_url: string | null; average_rating: number | null; review_count: number | null; address: string | null };

  return (
    <BookingProvider salonId={salon.id} initialStaffId={initialStaffId} initialService={initialService} initialServices={initialServices} initialStart={startParam}>
      {/* B1 (owner pick, council round 2026-06-11): white body — Fresha's two-tier
          surface model (white page + white cards with hairlines), no grey patchwork. */}
      <div className="min-h-screen bg-white">
        {/* Header with salon name */}
        {/* Solid white: --raised is 95%-alpha, which let scrolling content ghost
            through the sticky header (no backdrop blur here). */}
        <header className="sticky top-0 z-40 border-b border-s-border bg-white">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <BookingExitButton slug={slug} />
            {/* B1: step 1 titles the task; steps 2+ restore "Termin bei {salon}" */}
            <BookingHeaderTitle salonName={salon.name} />
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-2xl mx-auto px-4 py-6">
          {hasServices ? (
            <BookingWizard
              services={services}
              staffList={staff}
              salon={salon as unknown as Salon}
              staffServices={staffServices}
              serviceAddons={serviceAddons}
              serviceOptions={serviceOptions}
              isLoggedIn={isLoggedIn}
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
