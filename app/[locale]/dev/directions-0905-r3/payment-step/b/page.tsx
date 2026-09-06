// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// all unrelated round-2 UI treatments the owner killed on 2026-09-06 for OTHER screens (a grey
// canvas-band background, three home-feed layout options, three blank-state visual variants, a
// search-results sub-heading line, a per-card review count, a components preview page, and a
// service-row button-matching harness). None names this payment surface or a data loader.
// `npm run exists payment-step` (round-1/round-2 session context, re-verified this turn) shows
// round-1's four directions plus round-2's lift/rule/tray variants for this same surface; no
// round-3 candidate exists yet for it. Net-new: this file.
//
// Grounded-in: components-legacy/booking/PayConfirmStep.tsx (the real, live production booking
// step this whole family ports; content order per `fresha--payment-step.md`'s own port map), and
// PaymentStepLift.tsx / PaymentStepLiftReview.tsx, round 2's approved LIFT control for THIS EXACT
// surface (owner: "I like the lift. Lift is good."). Only the KitProvider's `system` prop changes,
// "lift" -> "b", per the task brief ("wrap the view in the kit provider with system=\"b\""). The
// data loader (getPaymentStepDataA) is IMPORTED from its real round-1 location, never copied; the
// anatomy is ported BY HAND into ./PaymentStepBReview.tsx (this builder's own file), never
// file-copied.
//
// Depicts: real BookingProvider wiring (services/staff/slot preselected) -> lib/booking-context.tsx
// Depicts: real seed data (salon, service, staff, slot) -> app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA.ts
//   (round-1's own loader, imported unchanged)
// Depicts: candidate B's review content -> ./PaymentStepBReview.tsx (this builder's own file)
//
// system: b. <KitProvider system="b"> wraps the tree once here so every kit component under
// PaymentStepBReview reads candidate B's value sheet via useSystem() (Card in particular).
import { BookingProvider } from "@/lib/booking-context";
import type { SelectedService } from "@/lib/booking-state";
import { getPaymentStepDataA } from "@/app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA";
import { KitProvider } from "./kit";
import PaymentStepBReview from "./PaymentStepBReview";

export default async function PaymentStepBPage() {
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
      <KitProvider system="b">
        <PaymentStepBReview salon={data.salon} staff={data.staff} />
      </KitProvider>
    </BookingProvider>
  );
}
