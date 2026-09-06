// Exists-check: `npm run exists payment-step` (run this session) -> 15 hits, all round-1
// (app/[locale]/dev/directions-0905/payment-step/_va,_vb,_vc/*, that route's own switcher) plus
// the round-2 switcher page.tsx and its already-built "tray" system (_tray/PaymentStepTray.tsx,
// created by a parallel session this same run). No "lift" system for this surface exists yet.
// This file is net-new: the LIFT system's own data-fetch wrapper for this surface, mirroring
// round-1's server-component pattern (PaymentStepDirectionA.tsx) and the sibling "tray" system's
// own wrapper (PaymentStepTray.tsx) rather than copying either.
//
// Grounded-in: app/[locale]/dev/directions-0905/payment-step/_va/PaymentStepDirectionA.tsx
// (server-component + BookingProvider wiring pattern: fetch real seed data, preselect a real
// cheapest service + a real staff member + a real future available slot, wrap BookingProvider
// around the review content) and its sibling getPaymentStepDataA.ts (IMPORTED here via the "@/"
// alias, never copied, per the task brief's "import its loader and its data path; do not copy
// files"). lib/booking-context.tsx (BookingProvider, off-limits, imported unchanged).
//
// Depicts: real BookingProvider wiring (services/staff/slot preselected) -> lib/booking-context.tsx
// Depicts: real seed data (salon, service, staff, slot) -> ../../../directions-0905/payment-step/_va/getPaymentStepDataA.ts
//   (round-1's own loader, imported, never re-implemented)
// Depicts: this system's review content -> ./PaymentStepLiftReview.tsx (net-new, this builder)
//
// system: lift. <KitProvider system="lift"> wraps the whole tree once here so every kit
// component under PaymentStepLiftReview reads the active system via useSystem() (Card, in
// particular: shadow, no border, per systems.ts's "lift" entry).
import { BookingProvider } from "@/lib/booking-context";
import type { SelectedService } from "@/lib/booking-state";
import { getPaymentStepDataA } from "@/app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA";
import { KitProvider } from "@/app/[locale]/dev/directions-0905-r2/_kit/KitProvider";
import PaymentStepLiftReview from "./PaymentStepLiftReview";

export default async function PaymentStepLift() {
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
      <KitProvider system="lift">
        <PaymentStepLiftReview salon={data.salon} staff={data.staff} />
      </KitProvider>
    </BookingProvider>
  );
}
