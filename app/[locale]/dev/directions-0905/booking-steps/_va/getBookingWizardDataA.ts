/**
 * Exists-check: `npm run exists booking-steps` -> 1 REMOVED hit (NailBookingSteps.tsx, the
 * old per-category nail wizard; unrelated, that graveyard entry names the CURRENT generic
 * wizard, components-legacy/booking/*, as the live replacement this loader feeds).
 * `npm run exists getBookingWizardData` -> 0 net-new for this exact name; a sibling direction
 * on this same surface already owns `_vb/getBookingWizardData.ts` and `_vc/getBookingWizardSeedData.ts`
 * (their own folders, read-only to this builder per the fan-out brief), so this file is
 * direction A's own copy of the same real query, not a duplicate concept, each direction
 * owns its own data fetch so no builder's file collides with another's.
 *
 * Server-only. Mirrors the REAL query in app/[locale]/salon/[slug]/booking/page.tsx (salon +
 * services + staff + staffServices + serviceAddons + serviceOptions + the redeemable-voucher
 * head-count check), trimmed to drop the ?staff=/?service=/?date=/?bundle= deep-link prefill
 * parsing (this mockup takes no query params) and the isSalonHidden owner/admin bypass (the
 * seed salon muse-beauty-studio is a normal is_active + listed_on_marketplace salon). Reads
 * with the admin client because this is a dev-only route under directions-0905/layout.tsx's
 * gate, same justification _shared/seedSalon.ts and _shared/seedBooking.ts already use.
 */
import { createAdminSupabaseClient, getSessionUser } from "@/lib/supabase";
import type { Salon, StaffMember } from "@/lib/types";

const MUSE_SLUG = "muse-beauty-studio";

export interface BookingWizardDataA {
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
  staffServices: { staff_member_id: string; service_id: string }[];
  serviceAddons: { service_id: string; addon_service_id: string; sort_order: number | null }[];
  serviceOptions: {
    id: string;
    service_id: string;
    name_de: string;
    name_en: string;
    price: number;
    duration_minutes: number;
    sort_order: number | null;
  }[];
  isLoggedIn: boolean;
  salonHasRedeemableVoucher: boolean;
  /** The salon's cheapest active service, preselected into the cart so the demo's Continue
   *  button is enabled on first paint (needed so the recorded video's click actually swaps
   *  a step; never a fabricated price, this is the real cheapest row). Null when the salon
   *  genuinely has no services. */
  cheapestService: { id: string; name_de: string; name_en: string; price: number; duration_minutes: number } | null;
}

export async function getBookingWizardDataA(): Promise<BookingWizardDataA | null> {
  const supabase = createAdminSupabaseClient();

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select(
      `id, owner_id, name, slug, description_de, description_en, address, latitude, longitude,
      cover_photo_url, average_rating, review_count, cancellation_window_hours,
      payment_mode, payment_mode_admin, payment_mode_enforced, deposit_percent, phone,
      accepts_online_payment, vat_registered, vat_rate, is_active, listed_on_marketplace, is_test`
    )
    .eq("slug", MUSE_SLUG)
    .maybeSingle();

  if (salonError || !salon) {
    console.error("[booking-steps/_va] muse-beauty-studio salon fetch failed:", salonError);
    return null;
  }

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select(
      "id, name_de, name_en, category, subcategory, duration_minutes, price, is_active, description_de, description_en, suitable_gender"
    )
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("category, name_de");

  if (servicesError || !services) {
    console.error("[booking-steps/_va] services fetch failed:", servicesError);
    return null;
  }

  const { data: staffRaw, error: staffError } = await supabase
    .from("staff_members")
    .select("id, name, avatar_url, specialties, is_active, average_rating, review_count, bio, languages")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("name");

  if (staffError || !staffRaw) {
    console.error("[booking-steps/_va] staff fetch failed:", staffError);
    return null;
  }

  const staff = staffRaw as unknown as StaffMember[];
  const bookingServices = services.map((s) => ({ ...s, is_active: s.is_active ?? true }));

  const staffIds = staff.map((s) => s.id);
  const serviceIds = bookingServices.map((s) => s.id);

  const staffServices = staffIds.length
    ? (await supabase.from("staff_services").select("staff_member_id, service_id").in("staff_member_id", staffIds)).data ?? []
    : [];
  const serviceAddons = serviceIds.length
    ? (await supabase.from("service_addons").select("service_id, addon_service_id, sort_order").in("service_id", serviceIds)).data ?? []
    : [];
  const serviceOptions = serviceIds.length
    ? (
        await supabase
          .from("service_options")
          .select("id, service_id, name_de, name_en, price, duration_minutes, sort_order")
          .in("service_id", serviceIds)
      ).data ?? []
    : [];

  const { count: redeemableVoucherCount } = await supabase
    .from("vouchers")
    .select("id", { head: true, count: "exact" })
    .eq("salon_id", salon.id)
    .not("remaining_amount", "is", null)
    .gt("remaining_amount", 0)
    .is("redeemed_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .limit(1);

  const { user } = await getSessionUser();

  const cheapest = [...bookingServices].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0] ?? null;

  return {
    salon: salon as unknown as Salon,
    services: bookingServices,
    staffList: staff,
    staffServices,
    serviceAddons,
    serviceOptions,
    isLoggedIn: Boolean(user),
    salonHasRedeemableVoucher: (redeemableVoucherCount ?? 0) > 0,
    cheapestService: cheapest
      ? {
          id: cheapest.id,
          name_de: cheapest.name_de,
          name_en: cheapest.name_en ?? cheapest.name_de,
          price: cheapest.price,
          duration_minutes: cheapest.duration_minutes,
        }
      : null,
  };
}
