// Exists-check: `npm run exists "payment-step rule"` (run this session) -> 2 hits, both already
// read and reused below (BodyText.tsx, Divider.tsx, same folder). `npm run exists payment-step`
// -> round-1's _va/_vb/_vc + the round-2 switcher page.tsx + the sibling "lift" and "tray"
// systems (built by parallel sessions this same run). No "rule" system wrapper for this surface
// exists yet. This file is net-new: the RULE system's own data-fetch wrapper, mirroring the
// already-shipped sibling wrappers (PaymentStepLift.tsx, PaymentStepTray.tsx) rather than
// copying either.
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
// Depicts: this system's review content -> ./PaymentStepRuleReview.tsx (net-new, this builder)
//
// system: rule. <KitProvider system="rule"> wraps the whole tree once here so every kit
// component under PaymentStepRuleReview reads the active system via useSystem() (Card's one
// named exception, the "entity" border override, in particular -- though this screen's own
// per-line instruction in R2_LOOK_SYSTEMS.md Part B ("the whole summary is bare label-and-value
// rows between inset hairlines") means PaymentStepRuleReview does not use Card at all: the
// identity-block exception is Profile's device, not this screen's).
import { BookingProvider } from "@/lib/booking-context";
import type { SelectedService } from "@/lib/booking-state";
import { getPaymentStepDataA } from "@/app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA";
import { KitProvider } from "@/app/[locale]/dev/directions-0905-r2/_kit/KitProvider";
import PaymentStepRuleReview from "./PaymentStepRuleReview";

export default async function PaymentStepRule() {
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
      <KitProvider system="rule">
        <PaymentStepRuleReview salon={data.salon} staff={data.staff} />
      </KitProvider>
    </BookingProvider>
  );
}
