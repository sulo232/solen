// Exists-check: `npm run exists directions-0905-r3` (run this session) -> 7 REMOVED-list hits
// from round-2 work unrelated to this surface (the grey TRAY band, the three home structures,
// the empty-state directions, the search results heading line, the review-count parentheses,
// the round-2 index's own component-isolation preview block, and a service-row button-matching
// harness); none of them is a payment-step route. `npm run exists payment-step` -> round-1's
// _va/_vb/_vc + round-2's switcher + lift/rule/tray systems (read in full this turn as the
// anatomy/container reference). No round-3 payment-step route exists for candidate A. This file
// is net-new: candidate A's own data-fetch wrapper for this surface, mirroring round-2's sibling
// wrappers (PaymentStepLift.tsx, PaymentStepRule.tsx) rather than copying either (never cp'd;
// written by hand from the pattern).
//
// Grounded-in: app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA.ts (round-1's
// own loader, IMPORTED here via the "@/" alias, never copied). lib/booking-context.tsx
// (BookingProvider, off-limits, imported unchanged).
//
// Depicts: real BookingProvider wiring (services/staff/slot preselected) -> lib/booking-context.tsx
// Depicts: real seed data (salon, service, staff, slot) -> ../../../directions-0905/payment-step/_va/getPaymentStepDataA.ts
// Depicts: candidate A's own review content -> ./PaymentStepAReview.tsx (net-new, this builder)
//
// system: a. <KitProvider system="a"> wraps the whole tree once here so every kit component
// under PaymentStepAReview reads candidate A's value sheet via useSystem() (Card's
// borderExceptionVariant="entity", in particular: the one named identity-block border exception
// _plans/R3_ONE_SYSTEM.md's CANDIDATE A table calls for).
import { BookingProvider } from "@/lib/booking-context";
import type { SelectedService } from "@/lib/booking-state";
import { getPaymentStepDataA } from "@/app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA";
import { KitProvider } from "@/app/[locale]/dev/directions-0905-r3/_kit";
import PaymentStepAReview from "./PaymentStepAReview";

export default async function PaymentStepR3CandidateA() {
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
      <KitProvider system="a">
        <PaymentStepAReview salon={data.salon} staff={data.staff} />
      </KitProvider>
    </BookingProvider>
  );
}
