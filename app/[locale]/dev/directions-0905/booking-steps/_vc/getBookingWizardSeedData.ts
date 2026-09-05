/**
 * Exists-check: `npm run exists booking sheet` -> 1 hit, CancelBookingSheet.tsx (an unrelated
 * cancel-flow sheet, not a booking-wizard loader). `npm run exists seedBooking` -> the sibling
 * _shared/seedBooking.ts, which loads ONE CONFIRMED booking row for the confirmation-screen
 * mockups; it does not load the salon/services/staff/staffServices/serviceAddons/serviceOptions
 * shape BookingWizard itself needs before a booking exists, so it is not reusable here. Net-new:
 * this loader, scoped to `booking-steps/_vc/` only per the brief (never edits the shared
 * `_shared/seedBooking.ts` or `_shared/seedSalon.ts`, per that folder's own README rule 4).
 *
 * Server-only. Mirrors the REAL route's query exactly: app/[locale]/salon/[slug]/booking/page.tsx
 * (same table, same columns, same filters), just pinned to the one seed salon this whole
 * directions-0905 pass already standardizes on (`muse-beauty-studio`, per _shared/seedBooking.ts's
 * own resolution order) instead of reading `params.slug`. Dev-only route (gated by
 * ../../layout.tsx), so the admin client bypassing RLS is the same accepted pattern seedSalon.ts
 * and seedBooking.ts already use.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { Salon, StaffMember } from "@/lib/types";
import type { StaffService, ServiceAddon, ServiceOption } from "./BookingWizardC";

const MUSE_SLUG = "muse-beauty-studio";

export interface BookingWizardSeedData {
  salon: Salon;
  services: Array<{
    id: string;
    name_de: string;
    name_en: string;
    category: string;
    subcategory: string | null;
    duration_minutes: number;
    price: number;
    is_active: boolean;
    description_de: string | null;
    description_en: string | null;
    suitable_gender: string[] | null;
  }>;
  staffList: StaffMember[];
  staffServices: StaffService[];
  serviceAddons: ServiceAddon[];
  serviceOptions: ServiceOption[];
  salonHasRedeemableVoucher: boolean;
}

let cached: BookingWizardSeedData | null = null;

/** One real, live salon (muse-beauty-studio) with its real services + staff, mapped into the
 * exact prop shape <BookingWizard> expects. Cached per server process (dev-only mockup, data
 * doesn't need to be request-fresh). Returns null only if the seed salon genuinely has no
 * active services or staff (never fabricated as a fallback). */
export async function getBookingWizardSeedData(): Promise<BookingWizardSeedData | null> {
  if (cached) return cached;

  const supabase = createAdminSupabaseClient();

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select(
      `id, owner_id, name, slug, description_de, description_en, address, latitude, longitude,
      cover_photo_url, average_rating, review_count, cancellation_window_hours,
      payment_mode, payment_mode_admin, payment_mode_enforced, deposit_percent, phone,
      accepts_online_payment, vat_registered, vat_rate, is_active, listed_on_marketplace, is_test`,
    )
    .eq("slug", MUSE_SLUG)
    .maybeSingle();

  if (salonError || !salon) {
    console.error("[booking-steps/_vc/getBookingWizardSeedData] salon lookup failed:", salonError);
    return null;
  }

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select(
      "id, name_de, name_en, category, subcategory, duration_minutes, price, is_active, description_de, description_en, suitable_gender",
    )
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("category, name_de");

  if (servicesError || !services || services.length === 0) {
    console.error("[booking-steps/_vc/getBookingWizardSeedData] services lookup failed:", servicesError);
    return null;
  }

  const { data: staffRaw, error: staffError } = await supabase
    .from("staff_members")
    .select("id, salon_id, name, avatar_url, specialties, is_active, average_rating, review_count, bio, languages")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("name");

  if (staffError || !staffRaw || staffRaw.length === 0) {
    console.error("[booking-steps/_vc/getBookingWizardSeedData] staff lookup failed:", staffError);
    return null;
  }

  const staffList = staffRaw as unknown as StaffMember[];
  const staffIds = staffList.map((s) => s.id);
  const serviceIds = services.map((s) => s.id);

  const { data: staffServices } = staffIds.length
    ? await supabase.from("staff_services").select("staff_member_id, service_id").in("staff_member_id", staffIds)
    : { data: [] as StaffService[] };

  const { data: serviceAddons } = serviceIds.length
    ? await supabase.from("service_addons").select("service_id, addon_service_id, sort_order").in("service_id", serviceIds)
    : { data: [] as ServiceAddon[] };

  const { data: serviceOptions } = serviceIds.length
    ? await supabase
        .from("service_options")
        .select("id, service_id, name_de, name_en, price, duration_minutes, sort_order")
        .in("service_id", serviceIds)
    : { data: [] as ServiceOption[] };

  const { count: redeemableVoucherCount } = await supabase
    .from("vouchers")
    .select("id", { head: true, count: "exact" })
    .eq("salon_id", salon.id)
    .not("remaining_amount", "is", null)
    .gt("remaining_amount", 0)
    .is("redeemed_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .limit(1);

  const bookingServices = services.map((s) => ({ ...s, is_active: s.is_active ?? true }));

  cached = {
    salon: salon as unknown as Salon,
    services: bookingServices,
    staffList,
    staffServices: (staffServices ?? []) as StaffService[],
    serviceAddons: (serviceAddons ?? []) as ServiceAddon[],
    serviceOptions: (serviceOptions ?? []) as ServiceOption[],
    salonHasRedeemableVoucher: (redeemableVoucherCount ?? 0) > 0,
  };

  return cached;
}
