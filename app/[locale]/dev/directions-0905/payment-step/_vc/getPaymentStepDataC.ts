/**
 * Exists-check: `npm run exists payment-step` -> 2 hits, the shared switcher page and its
 * exported symbol, both read-only to this builder. `npm run exists getBookingWizardData` ->
 * this direction's own file is net-new (a sibling `booking-steps/_va/getBookingWizardDataA.ts`
 * exists for a different surface and is read-only to this builder per the fan-out brief; this
 * file is direction C's own loader for THIS surface, payment-step, not a duplicate).
 * `npm run exists availability_slots` -> real table, reused below exactly as the real booking
 * flow queries it (no new table, no new column).
 *
 * Server-only. Grounded-in: app/[locale]/dev/directions-0905/booking-steps/_va/getBookingWizardDataA.ts
 * (the admin-client + real-salon-by-slug pattern this file follows, same seed salon
 * muse-beauty-studio, same "dev-only route under directions-0905/layout.tsx's gate" justification
 * seedSalon.ts / seedBooking.ts already use), and components-legacy/booking/PayConfirmStep.tsx
 * (the exact salon/staff/service/payment-mode fields this loader selects, so the mockup reads
 * the identical columns the real review-and-pay step reads, never a hand-picked subset).
 *
 * Depicts: salon + payment-mode fields -> PayConfirmStep.tsx lines ~58-196 (salonExt fields,
 * effectivePaymentMode, onlineAvailable derivation).
 * Depicts: cheapest active service -> booking-steps/_va/getBookingWizardDataA.ts's own
 * `cheapestService` resolution (same "sort ascending by price, take [0]" logic, not invented).
 * Depicts: a real upcoming appointment slot -> NET-NEW for this surface: the review-and-pay
 * step normally receives its date/time from the wizard's earlier "time" step (BookingContext),
 * which this standalone mockup does not render. Reading one real, currently-available
 * `availability_slots` row for the chosen staff+service (status='available', starts_at in the
 * future) is the seed fix for that missing upstream step (CLAUDE.md taste rule 1: "seeding the
 * database is not fabrication, it is the fix" reads the same for SELECTING a real row that
 * substitutes for a step this mockup intentionally does not render), never a fabricated date.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";

const MUSE_SLUG = "muse-beauty-studio";

export interface PaymentStepDataC {
  salon: {
    id: string;
    name: string;
    slug: string;
    address: string;
    coverPhotoUrl: string | null;
    averageRating: number | null;
    reviewCount: number;
    cancellationWindowHours: number;
    vatRegistered: boolean;
    vatRate: number;
    acceptsOnlinePayment: boolean;
  };
  staff: {
    name: string;
    avatarUrl: string | null;
  };
  service: {
    nameDe: string;
    nameEn: string;
    price: number;
    durationMinutes: number;
  };
  slot: {
    startsAt: string;
    endsAt: string;
  } | null;
}

export async function getPaymentStepDataC(): Promise<PaymentStepDataC | null> {
  const supabase = createAdminSupabaseClient();

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select(
      `id, name, slug, address, cover_photo_url, average_rating, review_count,
       cancellation_window_hours, vat_registered, vat_rate, accepts_online_payment`,
    )
    .eq("slug", MUSE_SLUG)
    .maybeSingle();

  if (salonError || !salon) {
    console.error("[payment-step/_vc] muse-beauty-studio salon fetch failed:", salonError);
    return null;
  }

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name_de, name_en, price, duration_minutes")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("price", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (serviceError || !service) {
    console.error("[payment-step/_vc] cheapest service fetch failed:", serviceError);
    return null;
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff_members")
    .select("id, name, avatar_url")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("name")
    .limit(1)
    .maybeSingle();

  if (staffError || !staff) {
    console.error("[payment-step/_vc] staff fetch failed:", staffError);
    return null;
  }

  const { data: slot } = await supabase
    .from("availability_slots")
    .select("starts_at, ends_at")
    .eq("salon_id", salon.id)
    .eq("service_id", service.id)
    .eq("staff_member_id", staff.id)
    .eq("status", "available")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    salon: {
      id: salon.id,
      name: salon.name,
      slug: salon.slug,
      address: salon.address ?? "",
      coverPhotoUrl: salon.cover_photo_url,
      averageRating: salon.average_rating,
      reviewCount: salon.review_count ?? 0,
      cancellationWindowHours: salon.cancellation_window_hours ?? 24,
      vatRegistered: Boolean(salon.vat_registered),
      vatRate: salon.vat_rate ?? 0,
      acceptsOnlinePayment: Boolean(salon.accepts_online_payment),
    },
    staff: {
      name: staff.name,
      avatarUrl: staff.avatar_url,
    },
    service: {
      nameDe: service.name_de,
      nameEn: service.name_en ?? service.name_de,
      price: service.price,
      durationMinutes: service.duration_minutes,
    },
    slot: slot ? { startsAt: slot.starts_at, endsAt: slot.ends_at } : null,
  };
}
