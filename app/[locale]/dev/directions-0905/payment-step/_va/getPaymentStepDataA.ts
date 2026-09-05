/**
 * Exists-check: `npm run exists payment-step` -> 2 (the switcher page.tsx + its exported
 * symbol, both already read and left alone). `npm run exists getBookingWizardDataA` -> the
 * sibling booking-steps/_va loader (a different surface's own folder, read-only reference
 * for its pattern, not imported). Net-new: this file. No prior loader fetched the exact
 * fields PayConfirmStep.tsx needs (salon payment fields + a real staff member + a real
 * future available slot) for a standalone review-step mockup.
 *
 * Grounded-in: components-legacy/booking/PayConfirmStep.tsx (the exact salon/staff/service
 * fields it reads: cancellation_window_hours, payment_mode(_admin/_enforced),
 * deposit_percent, accepts_online_payment, vat_registered, vat_rate), _shared/seedSalon.ts
 * and booking-steps/_va/getBookingWizardDataA.ts (server-only admin-client loader pattern
 * this file follows, same dev-only justification: this route is gated by
 * ../../layout.tsx and never runs in a real request path).
 *
 * Resolution order: (1) muse-beauty-studio's cheapest active service; (2) an active staff
 * member linked to that service via staff_services, else any active staff member at the
 * salon; (3) a REAL future `availability_slots` row (status 'available') for that exact
 * staff+service so the date/time shown on the review screen is a real bookable slot, not
 * an invented one; if none exists for that exact pair, relax to any future available slot
 * for the salon so the mockup still has a real starts_at to seed BookingProvider's
 * `initialStart` with (matches the real ?start=<ISO> deep-link path in
 * lib/booking-context.tsx, never a hand-typed date string).
 */
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { Salon, StaffMember } from "@/lib/types";

const MUSE_SLUG = "muse-beauty-studio";

export interface PaymentStepServiceA {
  id: string;
  name_de: string;
  name_en: string;
  duration_minutes: number;
  price: number;
}

export interface PaymentStepDataA {
  salon: Salon;
  service: PaymentStepServiceA;
  staff: StaffMember | null;
  /** ISO datetime of a real future available slot, or null if the salon genuinely has none
   *  right now (rare given ~92% of slot rows are future-dated per the 2026-09-02 backend
   *  snapshot); the page falls back to formData's own null date/time in that case, it never
   *  invents one. */
  slotStartsAt: string | null;
  isLoggedIn: boolean;
  salonHasRedeemableVoucher: boolean;
}

export async function getPaymentStepDataA(): Promise<PaymentStepDataA | null> {
  const supabase = createAdminSupabaseClient();

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select(
      `id, owner_id, name, slug, address, latitude, longitude, cover_photo_url,
      average_rating, review_count, cancellation_window_hours, payment_mode,
      payment_mode_admin, payment_mode_enforced, deposit_percent, accepts_online_payment,
      vat_registered, vat_rate, phone, is_active, listed_on_marketplace, is_test`,
    )
    .eq("slug", MUSE_SLUG)
    .maybeSingle();

  if (salonError || !salon) {
    console.error("[payment-step/_va] muse-beauty-studio salon fetch failed:", salonError);
    return null;
  }

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, name_de, name_en, duration_minutes, price")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("price", { ascending: true })
    .limit(1);

  if (servicesError || !services || services.length === 0) {
    console.error("[payment-step/_va] services fetch failed:", servicesError);
    return null;
  }
  const service = services[0];

  const { data: linkedStaffRow } = await supabase
    .from("staff_services")
    .select("staff_member_id")
    .eq("service_id", service.id)
    .limit(1)
    .maybeSingle();

  let staffRaw: Record<string, unknown> | null = null;
  if (linkedStaffRow?.staff_member_id) {
    const { data } = await supabase
      .from("staff_members")
      .select("id, name, avatar_url, specialties, is_active, average_rating, review_count, bio, languages")
      .eq("id", linkedStaffRow.staff_member_id)
      .eq("is_active", true)
      .maybeSingle();
    staffRaw = data;
  }
  if (!staffRaw) {
    const { data } = await supabase
      .from("staff_members")
      .select("id, name, avatar_url, specialties, is_active, average_rating, review_count, bio, languages")
      .eq("salon_id", salon.id)
      .eq("is_active", true)
      .order("name")
      .limit(1)
      .maybeSingle();
    staffRaw = data;
  }
  const staff = (staffRaw as unknown as StaffMember) ?? null;

  const nowIso = new Date().toISOString();
  let slotStartsAt: string | null = null;
  if (staff) {
    const { data: exactSlot } = await supabase
      .from("availability_slots")
      .select("starts_at")
      .eq("salon_id", salon.id)
      .eq("service_id", service.id)
      .eq("staff_member_id", staff.id)
      .eq("status", "available")
      .gt("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    slotStartsAt = exactSlot?.starts_at ?? null;
  }
  if (!slotStartsAt) {
    const { data: anySlot } = await supabase
      .from("availability_slots")
      .select("starts_at")
      .eq("salon_id", salon.id)
      .eq("status", "available")
      .gt("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    slotStartsAt = anySlot?.starts_at ?? null;
  }

  const { count: redeemableVoucherCount } = await supabase
    .from("vouchers")
    .select("id", { head: true, count: "exact" })
    .eq("salon_id", salon.id)
    .not("remaining_amount", "is", null)
    .gt("remaining_amount", 0)
    .is("redeemed_at", null)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .limit(1);

  return {
    salon: salon as unknown as Salon,
    service: {
      id: service.id,
      name_de: service.name_de,
      name_en: service.name_en ?? service.name_de,
      duration_minutes: service.duration_minutes,
      price: service.price,
    },
    staff,
    slotStartsAt,
    // Reviewed as a logged-in customer per the brief (kunde@solen.ch session); this mockup
    // never calls getSessionUser (dev-only static render), so it is fixed true rather than
    // read off a cookie the /dev route doesn't carry.
    isLoggedIn: true,
    salonHasRedeemableVoucher: (redeemableVoucherCount ?? 0) > 0,
  };
}
