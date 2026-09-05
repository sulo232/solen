/**
 * Exists-check: `npm run exists booking-steps` -> 1 REMOVED hit (NailBookingSteps, the old
 * per-category nail wizard, unrelated: this loader feeds the CURRENT generic booking wizard,
 * components-legacy/booking/*, which the graveyard entry names as the live replacement).
 * `npm run exists getBookingWizardData` -> 0, net-new.
 *
 * Server-only. Mirrors the REAL query in app/[locale]/salon/[slug]/booking/page.tsx
 * (services + staff + staffServices + serviceAddons + serviceOptions + the voucher
 * availability check), trimmed to drop the ?staff=/?service=/?date= deep-link prefill
 * parsing (this mockup never receives those query params) and the isSalonHidden owner/admin
 * bypass (the seed salon muse-beauty-studio is a normal listed salon, verified live). Reads
 * with the admin client because this is a dev-only route, same justification seedSalon.ts and
 * seedBooking.ts already use.
 */
import { createAdminSupabaseClient, getSessionUser } from "@/lib/supabase";
import type { Salon, StaffMember } from "@/lib/types";

const MUSE_SLUG = "muse-beauty-studio";

export interface BookingWizardData {
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
}

export async function getBookingWizardData(): Promise<BookingWizardData | null> {
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
    .single();

  if (salonError || !salon) return null;

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select(
      "id, name_de, name_en, category, subcategory, duration_minutes, price, is_active, description_de, description_en, suitable_gender"
    )
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("category, name_de");

  if (servicesError || !services || services.length === 0) return null;

  const { data: staffRaw, error: staffError } = await supabase
    .from("staff_members")
    .select("id, name, avatar_url, specialties, is_active, average_rating, review_count, bio, languages")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("name");

  if (staffError || !staffRaw) return null;

  const staffList = staffRaw as StaffMember[];
  const staffIds = staffList.map((s) => s.id);
  const serviceIds = services.map((s) => s.id);

  const staffServices = staffIds.length
    ? (
        await supabase
          .from("staff_services")
          .select("staff_member_id, service_id")
          .in("staff_member_id", staffIds)
      ).data ?? []
    : [];
  const serviceAddons = serviceIds.length
    ? (
        await supabase
          .from("service_addons")
          .select("service_id, addon_service_id, sort_order")
          .in("service_id", serviceIds)
      ).data ?? []
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

  const bookingServices = services.map((s) => ({ ...s, is_active: s.is_active ?? true }));

  return {
    salon: salon as unknown as Salon,
    services: bookingServices,
    staffList,
    staffServices,
    serviceAddons,
    serviceOptions,
    isLoggedIn: Boolean(user),
    salonHasRedeemableVoucher: (redeemableVoucherCount ?? 0) > 0,
  };
}
