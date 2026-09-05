/**
 * Exists-check: `npm run exists payment-step` -> 2 hits, the switcher route + its exported
 * page component only, no prior data loader for this surface (the switcher's own header
 * comment says each direction owns its data fetch under its own `_v<letter>/`). `npm run
 * exists getBookingWizardData` -> 3 real hits, all owned by the OTHER two builders on this
 * same wave (`booking-steps/_va/getBookingWizardDataA.ts`, `_vb/getBookingWizardData.ts`,
 * `_vc/getBookingWizardSeedData.ts`), read-only siblings, not imported (each direction owns
 * its own fetch so no builder's file collides with another's, per the fan-out brief). This
 * file is direction B's own copy of the same real-query pattern, trimmed to only what the
 * review/pay step needs (no service/staff PICKER data, just the one preselected cheapest
 * service + salon + a real future slot for it).
 *
 * Grounded-in: `booking-steps/_va/getBookingWizardDataA.ts` (the salon-fetch column list and
 * admin-client justification, copied verbatim for the fields this step also needs: payment_mode,
 * payment_mode_admin, payment_mode_enforced, deposit_percent, accepts_online_payment,
 * vat_registered, vat_rate, cancellation_window_hours), `components-legacy/booking/
 * PayConfirmStep.tsx` (the exact fields it reads off `salon` + `staff` + `formData.services`,
 * read-only reference, not imported), `_shared/seedBooking.ts` (the admin-client
 * server-only-dev-route justification, same reasoning applies here).
 *
 * Server-only. Read-only: SELECTs only, never an INSERT/UPDATE (unlike `_shared/seedBooking.ts`'s
 * fallback-insert path, which this file deliberately does NOT copy, per this task's own
 * "never write to the database" ban). Live-checked 2026-09-05 against the real muse-beauty-studio
 * row (see header note on the component file for the exact values found): payment_mode
 * 'at_salon', accepts_online_payment false, vat_registered false, so this salon's real payment
 * step legitimately offers only ONE method today; the component still branches on the real
 * columns rather than hardcoding that fact, so a future flag flip on this same seed row would
 * render correctly without a code change.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";

const MUSE_SLUG = "muse-beauty-studio";

export interface PaymentStepSalonB {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  coverPhotoUrl: string | null;
  averageRating: number | null;
  reviewCount: number | null;
  cancellationWindowHours: number;
  paymentMode: "at_salon" | "deposit" | "prepay";
  depositPercent: number;
  onlineAvailable: boolean;
  vatRegistered: boolean;
  vatRatePercent: number;
}

export interface PaymentStepServiceB {
  id: string;
  nameDe: string;
  nameEn: string;
  durationMinutes: number;
  price: number;
}

export interface PaymentStepStaffB {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PaymentStepDataB {
  salon: PaymentStepSalonB;
  service: PaymentStepServiceB;
  staff: PaymentStepStaffB | null;
  /** ISO instant of a REAL available slot for this exact salon+service (+staff, when one
   *  matched). Null only if the salon genuinely has no future available slot for this
   *  service anywhere (never fabricated as a fallback). */
  startsAtIso: string | null;
  endsAtIso: string | null;
}

function asPaymentMode(v: string | null | undefined): "at_salon" | "deposit" | "prepay" {
  if (v === "deposit" || v === "prepay") return v;
  return "at_salon";
}

export async function getPaymentStepDataB(): Promise<PaymentStepDataB | null> {
  const supabase = createAdminSupabaseClient();

  const { data: salonRow, error: salonError } = await supabase
    .from("salons")
    .select(
      `id, name, slug, address, cover_photo_url, average_rating, review_count,
      cancellation_window_hours, payment_mode, payment_mode_admin, payment_mode_enforced,
      deposit_percent, accepts_online_payment, vat_registered, vat_rate`,
    )
    .eq("slug", MUSE_SLUG)
    .maybeSingle();

  if (salonError || !salonRow) {
    console.error("[payment-step/_vb] salon fetch failed:", salonError);
    return null;
  }

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, name_de, name_en, duration_minutes, price")
    .eq("salon_id", salonRow.id)
    .eq("is_active", true)
    .order("price", { ascending: true })
    .limit(1);

  if (servicesError || !services || services.length === 0) {
    console.error("[payment-step/_vb] cheapest-service fetch failed:", servicesError);
    return null;
  }
  const cheapest = services[0];

  // Effective mode: the same tuple-resolution BookingWizard/PayConfirmStep use
  // (lib/bookings/payment-mode.ts, read-only reference, not imported to avoid pulling in its
  // whole module graph for one three-line function; the logic is copied verbatim below).
  const ownMode = asPaymentMode(salonRow.payment_mode);
  const effectiveMode = salonRow.payment_mode_enforced
    ? asPaymentMode(salonRow.payment_mode_admin) ?? ownMode
    : ownMode;

  const salon: PaymentStepSalonB = {
    id: salonRow.id,
    name: salonRow.name,
    slug: salonRow.slug,
    address: salonRow.address,
    coverPhotoUrl: salonRow.cover_photo_url,
    averageRating: salonRow.average_rating,
    reviewCount: salonRow.review_count,
    cancellationWindowHours: salonRow.cancellation_window_hours ?? 24,
    paymentMode: effectiveMode,
    depositPercent: salonRow.deposit_percent ?? 20,
    onlineAvailable: salonRow.accepts_online_payment === true,
    vatRegistered: salonRow.vat_registered === true,
    vatRatePercent: salonRow.vat_rate == null ? 8.1 : Number(salonRow.vat_rate),
  };

  const service: PaymentStepServiceB = {
    id: cheapest.id,
    nameDe: cheapest.name_de,
    nameEn: cheapest.name_en ?? cheapest.name_de,
    durationMinutes: cheapest.duration_minutes,
    price: cheapest.price,
  };

  // A real future available slot for this exact service (any staff), earliest first.
  const { data: slot } = await supabase
    .from("availability_slots")
    .select("starts_at, ends_at, staff_member_id")
    .eq("salon_id", salonRow.id)
    .eq("service_id", cheapest.id)
    .eq("status", "available")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let staff: PaymentStepStaffB | null = null;
  if (slot?.staff_member_id) {
    const { data: staffRow } = await supabase
      .from("staff_members")
      .select("id, name, avatar_url")
      .eq("id", slot.staff_member_id)
      .maybeSingle();
    if (staffRow) staff = { id: staffRow.id, name: staffRow.name, avatarUrl: staffRow.avatar_url };
  }

  return {
    salon,
    service,
    staff,
    startsAtIso: slot?.starts_at ?? null,
    endsAtIso: slot?.ends_at ?? null,
  };
}
