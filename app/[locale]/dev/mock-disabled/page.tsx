/**
 * Mockup-scope: whole-page
 * Exists-check: `npm run exists mock-disabled` -> 0 hits (net-new route). `npm run exists
 * decision-disabled` -> the v1 A/B panel mockup (app/[locale]/dev/decision-disabled/page.tsx,
 * kept on disk untouched, superseded by this route per the owner's 2026-07-13 rewrite).
 * `npm run exists BookingWizard/PayConfirmStep/GuestBookingForm` -> all real
 * (components-legacy/booking/). Net-new: this whole-page route drives the REAL 3-step
 * booking wizard (BookingProvider + BookingWizard, the exact components
 * app/[locale]/salon/[slug]/booking/page.tsx mounts) to its real "pay-confirm" step with a
 * real seeded service, instead of v1's isolated primitive-field panel.
 *
 * Decision: disabled-control opacity, opacity-40 (Switch/Checkbox/Radio's own baked-in
 * class today) vs. opacity-50 (the LOCKED design-contract "disabled" row, already shipped
 * by this exact CTA, PayConfirmStep.tsx:604 `disabled:opacity-50`).
 *
 * Real-composition blocker (named, not faked): the real GuestBookingForm.tsx (the guest
 * contact fields on THIS step) uses plain <input> elements, not the TextInput/Switch/
 * Checkbox/Radio primitives v1 assumed, there is no Switch/Checkbox/Radio anywhere in this
 * real composition. The CTA is also only ever actually `disabled` while a booking submit
 * is in flight (`disabled={isSubmitting}`), never at rest. Neither GuestBookingForm.tsx nor
 * PayConfirmStep.tsx is edited: the CTA and the 3 real guest inputs get their
 * disabled-opacity LOOK forced via a scoped wrapper override (targeting the CTA's own real
 * `disabled:opacity-50` class substring, and the real guest-field ids), simulating the
 * decision rather than modifying the components or the wizard's real disabled logic.
 *
 * BookingWizard always opens on 'services-staff' (lib/booking-context.tsx's fixed initial
 * state); JumpToBookingStep (dev/_shared, new) drives the wizard's OWN real goToStep()
 * navigation function to land on 'pay-confirm' right after mount, the exact function the
 * wizard's own back button calls, no wizard internals are touched. This means the
 * server-rendered first paint briefly shows step 1 before client hydration jumps to
 * step 3 (expected for a client-side-only step machine, not a bug).
 *
 * Real-composition blocker (named, not faked): the real booking route
 * (/salon/[slug]/booking) hides the app-wide Header/Footer via HideInBooking's booking-path
 * match; this mock lives at /dev/mock-disabled, which HideInBooking does not match, so an
 * extra global Header/Footer renders around the wizard that a real booking visitor never
 * sees. Structural to every /dev/* route (see mock-backbutton's docstring for the same
 * caveat on the PDP side); not fixable without editing HideInBooking.tsx, out of scope.
 */
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { BookingProvider } from "@/lib/booking-context";
import { BookingWizard } from "@/components-legacy/booking";
import type { Salon, StaffMember } from "@/lib/types";
import { getSeedSalon } from "../_shared/seedSalon";
import { JumpToBookingStep } from "../_shared/JumpToBookingStep";
import { VariantSwitcher } from "../_shared/VariantSwitcher";

export default async function MockDisabledPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { v } = await searchParams;
  const variant = v === "50" ? "50" : "40";

  const seed = await getSeedSalon("de");
  if (!seed) notFound();

  const supabase = createAdminSupabaseClient();
  const { data: salon } = await supabase
    .from("salons")
    .select(
      "id, name, slug, description_de, description_en, address, latitude, longitude, cover_photo_url, average_rating, review_count, cancellation_window_hours, payment_mode, deposit_percent, phone, accepts_online_payment, vat_registered, vat_rate"
    )
    .eq("slug", seed.slug)
    .eq("is_active", true)
    .single();
  if (!salon) notFound();

  const { data: services } = await supabase
    .from("services")
    .select(
      "id, name_de, name_en, category, subcategory, duration_minutes, price, is_active, description_de, description_en, suitable_gender"
    )
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("category, name_de");
  if (!services || services.length === 0) notFound();

  // Same coalesce the real booking page does (app/[locale]/salon/[slug]/booking/page.tsx:227):
  // is_active is nullable in the database but the query above already filters on it being true,
  // so every returned row genuinely has it. The wizard's own type wants it non-null.
  const bookingServices = services.map((s) => ({ ...s, is_active: s.is_active ?? true }));

  const { data: staffRaw } = await supabase
    .from("staff_members")
    .select("id, name, avatar_url, specialties, is_active, average_rating, review_count, bio, languages")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("name");
  const staff = (staffRaw ?? []) as StaffMember[];

  const staffIds = staff.map((s) => s.id);
  const serviceIds = services.map((s) => s.id);
  const { data: staffServices } = staffIds.length
    ? await supabase.from("staff_services").select("staff_member_id, service_id").in("staff_member_id", staffIds)
    : { data: [] };
  const { data: serviceAddons } = serviceIds.length
    ? await supabase.from("service_addons").select("service_id, addon_service_id, sort_order").in("service_id", serviceIds)
    : { data: [] };
  const { data: serviceOptions } = serviceIds.length
    ? await supabase
        .from("service_options")
        .select("id, service_id, name_de, name_en, price, duration_minutes, sort_order")
        .in("service_id", serviceIds)
    : { data: [] };

  const initialService = {
    id: services[0].id,
    name_de: services[0].name_de ?? "",
    name_en: services[0].name_en ?? services[0].name_de ?? "",
    price: services[0].price ?? 0,
    duration_minutes: services[0].duration_minutes ?? 0,
  };

  return (
    <div className={variant === "50" ? "mock-disabled-50" : "mock-disabled-40"}>
      <style>{`
        .mock-disabled-40 [class*="disabled:opacity-50"],
        .mock-disabled-40 #guest-name,
        .mock-disabled-40 #guest-phone,
        .mock-disabled-40 #guest-email {
          opacity: 0.4 !important;
          pointer-events: none !important;
          cursor: not-allowed !important;
        }
        .mock-disabled-50 [class*="disabled:opacity-50"],
        .mock-disabled-50 #guest-name,
        .mock-disabled-50 #guest-phone,
        .mock-disabled-50 #guest-email {
          opacity: 0.5 !important;
          pointer-events: none !important;
          cursor: not-allowed !important;
        }
      `}</style>
      <div className="min-h-screen bg-s-bg-sunken">
        <main className="mx-auto max-w-2xl px-4 pb-6 pt-3">
          <BookingProvider salonId={salon.id} initialService={initialService}>
            <JumpToBookingStep step="pay-confirm">
              <BookingWizard
                services={bookingServices}
                staffList={staff}
                salon={salon as unknown as Salon}
                staffServices={staffServices ?? []}
                serviceAddons={serviceAddons ?? []}
                serviceOptions={serviceOptions ?? []}
                isLoggedIn={false}
                // Owner 2026-08-21: this dev route previews the disabled-CTA state, not the
                // voucher variant, so it passes false. The real booking page computes this
                // value from the salon's own redeemable vouchers.
                salonHasRedeemableVoucher={false}
              />
            </JumpToBookingStep>
          </BookingProvider>
        </main>
      </div>
      <VariantSwitcher
        options={[
          { value: "40", label: "opacity-40" },
          { value: "50", label: "opacity-50" },
        ]}
        bottomClassName="bottom-24"
      />
    </div>
  );
}
