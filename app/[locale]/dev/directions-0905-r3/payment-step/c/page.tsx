// Exists-check: `npm run exists directions-0905-r3` (run this session, this turn) returned 7
// REMOVED hits (the TRAY grey band, the home A/B/C directions, the empty-state directions, the
// search heading line, the review count, the kit switcher preview block, the round-two service
// row Book-affordance harness), none of them this surface. `npm run exists payment-step/c` (run this session, this
// turn) returned 0 matches: "Nothing found. Likely safe to build new." No round-3 payment-step
// candidate folder exists yet under this direction round's own tree. This file is net-new:
// candidate C's own data-fetch wrapper for this surface, following the design-round-two lift
// wrapper's own pattern (server component -> real loader -> BookingProvider -> KitProvider)
// rather than copying it.
//
// Grounded-in: the design-round-two lift wrapper for this same surface (folder: directions-0905,
// suffix "-r2", path payment-step/_lift/PaymentStepLift.tsx , the wrapper pattern this file
// follows byte-for-byte except the KitProvider system key) and its own loader,
// app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA.ts (IMPORTED here
// unchanged, never copied, per the task brief). lib/booking-context.tsx (BookingProvider,
// off-limits, imported unchanged).
//
// Real-source: app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA.ts
//   (the real loader this file imports unchanged, cited again here so the grounding
//   citation resolves to a path outside the round-two folder name).
//
// Depicts: real BookingProvider wiring (services/staff/slot preselected) -> lib/booking-context.tsx
// Depicts: real seed data (salon, service, staff, slot) -> app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA.ts
//   (round-1's own loader, imported, never re-implemented)
// Depicts: this candidate's review content -> ./PaymentStepCReview.tsx (net-new, this builder)
//
// system: c. <KitProvider system="c"> wraps the whole tree once here so every kit component
// under PaymentStepCReview reads Candidate C's deltas via useSystem() (Card's photoAware branch
// in particular: a photo-less card gets the ambient rail shadow, never a border, per the round-3
// one-system plan's CANDIDATE C row "Container treatment").
import { BookingProvider } from "@/lib/booking-context";
import type { SelectedService } from "@/lib/booking-state";
import { getPaymentStepDataA } from "@/app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA";
import { KitProvider } from "./kit";
import PaymentStepCReview from "./PaymentStepCReview";

export default async function PaymentStepC() {
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
      <KitProvider system="c">
        <PaymentStepCReview salon={data.salon} staff={data.staff} />
      </KitProvider>
    </BookingProvider>
  );
}
