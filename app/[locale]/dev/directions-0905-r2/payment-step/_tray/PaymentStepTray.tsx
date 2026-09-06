// Exists-check: `npm run exists payment-step` (run this session) -> 13 hits, all round-1
// (app/[locale]/dev/directions-0905/payment-step/_va,_vb,_vc/*). `npm run exists BookingProvider`
// -> 1 hit, the real context provider (lib/booking-context.tsx, off-limits, imported unchanged).
// No round-2 payment-step surface exists yet. This file is net-new: the TRAY system's own
// data-fetch wrapper for this surface, mirroring round-1's server-component pattern
// (PaymentStepDirectionA.tsx) rather than copying it.
//
// Grounded-in: app/[locale]/dev/directions-0905/payment-step/_va/PaymentStepDirectionA.tsx
// (server-component + BookingProvider wiring pattern: fetch real seed data, preselect a real
// cheapest service + a real staff member + a real future available slot, wrap BookingProvider
// around the review content) and its sibling getPaymentStepDataA.ts (IMPORTED here, not copied,
// per the task brief's "import its loader and its data path; do not copy files").
//
// Depicts: real BookingProvider wiring (services/staff/slot preselected) -> lib/booking-context.tsx
// Depicts: real seed data (salon, service, staff, slot) -> app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA.ts
//   (round-1's own loader, imported, never re-implemented)
// Depicts: this system's review content -> ./PaymentStepReviewTray.tsx (net-new, this builder)
//
// system: tray. <KitProvider system="tray"> wraps the whole tree once here so every kit
// component under PaymentStepReviewTray reads the active system via useSystem().
import { BookingProvider } from "@/lib/booking-context";
import type { SelectedService } from "@/lib/booking-state";
import { getPaymentStepDataA } from "../../../directions-0905/payment-step/_va/getPaymentStepDataA";
import { KitProvider } from "../../_kit/KitProvider";
import PaymentStepReviewTray from "./PaymentStepReviewTray";

export default async function PaymentStepTray() {
  const data = await getPaymentStepDataA();

  if (!data) {
    return (
      <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
        The seed salon (muse-beauty-studio) or its cheapest service could not be loaded. See the
        server console for the query that failed.
      </div>
    );
  }

  const initialServices: SelectedService[] = [
    {
      id: data.service.id,
      name_de: data.service.name_de,
      name_en: data.service.name_en,
      price: data.service.price,
      duration_minutes: data.service.duration_minutes,
    },
  ];

  return (
    <BookingProvider
      salonId={data.salon.id}
      initialServices={initialServices}
      initialStaffId={data.staff?.id}
      initialStart={data.slotStartsAt ?? undefined}
    >
      <KitProvider system="tray">
        <PaymentStepReviewTray
          salon={data.salon}
          staff={data.staff}
          isLoggedIn={data.isLoggedIn}
          salonHasRedeemableVoucher={data.salonHasRedeemableVoucher}
        />
      </KitProvider>
    </BookingProvider>
  );
}
