/**
 * Grounded-in: app/[locale]/confirmation/page.tsx (BOOKING_SELECT + the exact mapping
 * this loader mirrors), components-legacy/booking/BookingConfirmation.tsx (the props
 * shape returned), app/[locale]/dev/_shared/seedSalon.ts (the real-data loader pattern
 * this file follows: server-only, admin client, per-process cache).
 *
 * Exists-check: `npm run exists seedBooking` -> 0, net-new. No dev route previously
 * loaded a REAL booking row for a server-rendered mockup.
 *
 * Server-only. Dev-only route (gated by ../layout.tsx), so reading with the service-role
 * admin client (bypassing RLS) is acceptable here the same way seedSalon.ts already does
 * it: this never runs in a real request path, only inside /dev/directions-0905/*.
 *
 * Depicts: booking confirmation seed data -> app/[locale]/confirmation/page.tsx (same
 * BOOKING_SELECT, same salon/service/staff mapping, same computeVat + formatCurrency
 * helpers, so a direction mockup renders the identical shape the real page renders).
 *
 * Resolution order (owner brief, verbatim): (1) a confirmed booking for the seed test
 * salon `muse-beauty-studio`, salon+service+staff all present; (2) else ANY confirmed
 * booking with a salon, a service and a staff member, preferring one that also settled
 * payment (payment_status 'paid') so the receipt's paid/VAT branch has something real to
 * show; (3) only if the bookings table has genuinely no confirmed row anywhere, INSERT
 * one through the real table using real salon/service/staff ids (never through Stripe,
 * never fabricated in JSX). Checked live 2026-09-05: step (1) found nothing for
 * muse-beauty-studio, step (2) found real confirmed+paid rows elsewhere, so step (3)
 * never fires today; the insert path stays here for the day step (2) also comes back
 * empty. `bookings` carries no `is_test` column (grepped _inventory/_db-columns.json
 * before writing this), so that column is never referenced.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format-currency";
import { computeVat } from "@/lib/vat";
import { localizedField } from "@/lib/i18n/localized-field";
import type { BookingConfirmationProps } from "@/components-legacy/booking/BookingConfirmation";

// The SAME select the real confirmation page uses, so a direction mockup reads off the
// identical columns the product query does (never a hand-picked subset).
const BOOKING_SELECT = `id, salon_id, service_id, staff_member_id, starts_at, ends_at,
  price_paid, remaining_at_salon, paid_amount, status, payment_status, payment_intent_id, reference_code, paid_via, user_id, access_token_hash, access_token_expires_at, vat_rate,
  salons(id, name, slug, address, phone, cover_photo_url, vat_number),
  services(id, name_de, name_en, duration_minutes, price),
  staff_members(name)`;

const MUSE_SLUG = "muse-beauty-studio";

const cacheByLocale = new Map<string, BookingConfirmationProps>();

type RawBookingRow = {
  id: string;
  salon_id: string | null;
  service_id: string | null;
  staff_member_id: string | null;
  starts_at: string;
  ends_at: string;
  price_paid: number;
  remaining_at_salon: number | null;
  paid_amount: number | null;
  status: string | null;
  payment_status: string | null;
  payment_intent_id: string | null;
  reference_code: string | null;
  paid_via: string | null;
  user_id: string | null;
  access_token_hash: string | null;
  access_token_expires_at: string | null;
  vat_rate: number | null;
  salons: unknown;
  services: unknown;
  staff_members: unknown;
};

/** One real, live, confirmed booking with a salon + service + staff member, mapped into
 * the exact prop shape <BookingConfirmation> expects. Cached per server process + locale
 * (dev-only mockups, data doesn't need to be request-fresh). Returns null only if the DB
 * genuinely has no usable row AND the fallback insert also fails (never fabricated). */
export async function getSeedBooking(locale: string): Promise<BookingConfirmationProps | null> {
  const cached = cacheByLocale.get(locale);
  if (cached) return cached;

  const supabase = createAdminSupabaseClient();

  const row = await resolveBookingRow(supabase);
  if (!row) return null;

  const props = mapRowToProps(row, locale);
  cacheByLocale.set(locale, props);
  return props;
}

async function resolveBookingRow(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
): Promise<RawBookingRow | null> {
  // (1) muse-beauty-studio, confirmed, salon+service+staff present.
  const { data: museSalon } = await supabase
    .from("salons")
    .select("id")
    .eq("slug", MUSE_SLUG)
    .maybeSingle();

  if (museSalon) {
    const { data: museBooking } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("salon_id", museSalon.id)
      .eq("status", "confirmed")
      .not("service_id", "is", null)
      .not("staff_member_id", "is", null)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (museBooking) return museBooking as unknown as RawBookingRow;
  }

  // (2) any confirmed booking with a salon, a service and a staff member. Prefer one that
  // also settled payment so the receipt's paid/VAT branch renders on something real.
  const { data: paidBooking } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("status", "confirmed")
    .eq("payment_status", "paid")
    .not("salon_id", "is", null)
    .not("service_id", "is", null)
    .not("staff_member_id", "is", null)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (paidBooking) return paidBooking as unknown as RawBookingRow;

  const { data: anyBooking } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("status", "confirmed")
    .not("salon_id", "is", null)
    .not("service_id", "is", null)
    .not("staff_member_id", "is", null)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (anyBooking) return anyBooking as unknown as RawBookingRow;

  // (3) genuinely nothing confirmed anywhere: seed ONE through the real table, real ids.
  return seedOneBooking(supabase);
}

/** Only reached when the live DB has no confirmed booking at all. Inserts a real row
 * (never through Stripe) using real seeded salon/service/staff ids, so this is the seed
 * fix (CLAUDE.md taste rule 1: "seeding the database is not fabrication, it is the fix"),
 * not a fabricated value. */
async function seedOneBooking(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
): Promise<RawBookingRow | null> {
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("slug", MUSE_SLUG)
    .maybeSingle();
  if (!salon) return null;

  const { data: service } = await supabase
    .from("services")
    .select("id, price, duration_minutes")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("price", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!service) return null;

  const { data: staff } = await supabase
    .from("staff_members")
    .select("id")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!staff) return null;

  const startsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days out
  const endsAt = new Date(startsAt.getTime() + (service.duration_minutes ?? 30) * 60 * 1000);

  // bookings.slot_id is a required NOT NULL FK to availability_slots (same requirement
  // the real seed route hits, app/api/admin/test-salon/seed/route.ts's bookings case), so
  // a backing slot has to exist before the booking row can be inserted.
  const { data: slot, error: slotError } = await supabase
    .from("availability_slots")
    .insert({
      salon_id: salon.id,
      service_id: service.id,
      staff_member_id: staff.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "booked",
    })
    .select("id")
    .single();

  if (slotError || !slot) {
    console.error("[directions-0905/seedBooking] slot insert failed:", slotError);
    return null;
  }

  const { data: inserted, error } = await supabase
    .from("bookings")
    .insert({
      salon_id: salon.id,
      service_id: service.id,
      staff_member_id: staff.id,
      slot_id: slot.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "confirmed",
      payment_status: "paid",
      price_paid: service.price,
      paid_via: "stripe",
    })
    .select(BOOKING_SELECT)
    .single();

  if (error) {
    console.error("[directions-0905/seedBooking] insert failed:", error);
    return null;
  }
  return inserted as unknown as RawBookingRow;
}

function mapRowToProps(row: RawBookingRow, locale: string): BookingConfirmationProps {
  const localeCode =
    locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";

  const salon = (Array.isArray(row.salons) ? row.salons[0] : row.salons) as {
    id?: string;
    name?: string;
    slug?: string;
    address?: string;
    cover_photo_url?: string | null;
    vat_number?: string | null;
  } | null;
  const service = (Array.isArray(row.services) ? row.services[0] : row.services) as {
    price?: number | null;
    duration_minutes?: number | null;
  } | null;
  const staff = (Array.isArray(row.staff_members) ? row.staff_members[0] : row.staff_members) as {
    name?: string | null;
  } | null;

  const serviceName = localizedField(service as Record<string, unknown> | null, "name", locale);
  const isGuest = !row.user_id;

  const vatRateApplied = Number(row.vat_rate ?? 0);
  const grossRappen = Math.round(Number(row.price_paid ?? 0) * 100);
  const vat =
    vatRateApplied > 0 && grossRappen > 0
      ? computeVat(grossRappen, { registered: true, ratePercent: vatRateApplied })
      : { netRappen: 0, vatRappen: 0, ratePercent: 0 };

  return {
    referenceCode: row.reference_code ?? null,
    salonName: salon?.name || "",
    salonSlug: salon?.slug || "",
    salonAddress: salon?.address || "",
    salonCoverUrl: salon?.cover_photo_url || null,
    serviceName,
    servicePrice: service?.price ?? null,
    staffName: staff?.name || null,
    startsAt: row.starts_at,
    durationMinutes: service?.duration_minutes ?? null,
    pricePaid: row.price_paid,
    priceLabel: formatCurrency(row.price_paid, localeCode),
    paidVia: row.paid_via ?? null,
    status: row.status ?? null,
    paymentStatus: row.payment_status ?? null,
    paidNowLabel: formatCurrency(Number(row.paid_amount ?? 0) / 100, localeCode),
    remainingAtSalonLabel:
      row.remaining_at_salon != null ? formatCurrency(Number(row.remaining_at_salon), localeCode) : null,
    hasOnlinePayment: Boolean(row.payment_intent_id),
    isGuest,
    // No raw access_token is ever stored (only its hash), so a dev seed has nothing to
    // build a real guest link from; matches production behavior for a direct, non-linked
    // visit (no ?access_token= in the URL).
    accessLink: null,
    accessToken: null,
    contactEmail: null,
    vatRate: vat.ratePercent,
    netLabel: formatCurrency(vat.netRappen / 100, localeCode),
    vatLabel: formatCurrency(vat.vatRappen / 100, localeCode),
    salonVatNumber: salon?.vat_number ?? null,
    bookingId: row.id,
    salonId: row.salon_id ?? salon?.id ?? "",
    serviceId: row.service_id ?? "",
    staffId: row.staff_member_id ?? null,
    endsAt: row.ends_at,
  };
}
