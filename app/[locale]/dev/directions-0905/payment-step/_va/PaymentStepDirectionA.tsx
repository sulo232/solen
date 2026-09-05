// Exists-check: `npm run exists payment-step` -> 2 (the shared switcher, read-only).
// `npm run exists BookingProvider` -> 1 hit, the real context provider (lib/booking-context.tsx,
// off-limits, imported unchanged, same as booking-steps/_va/BookingStepsDirectionA.tsx does).
//
// Grounded-in: app/[locale]/dev/directions-0905/booking-steps/_va/BookingStepsDirectionA.tsx
// (server-component + BookingProvider wiring pattern, adapted: that file mounts the whole
// slide-stack wizard, this direction mounts only the review-step content since the brief for
// THIS surface is "review and pay step", not the full flow).
//
// Depicts: real BookingProvider wiring (services/staff/slot preselected) -> lib/booking-context.tsx
//   (initialServices/initialStaffId/initialStart props, unchanged, imported).
// Depicts: this direction's review content -> ./PaymentStepReviewA.tsx (net-new, this builder).
//
// Server component: fetches real muse-beauty-studio data via ./getPaymentStepDataA.ts, then
// wraps the real <BookingProvider> around this direction's own review view so useBooking()
// inside it reads the exact same shape PayConfirmStep.tsx reads (formData.services,
// selectedDate, selectedTime, totalPrice), preselected from a REAL cheapest service + a REAL
// staff member + a REAL future available slot (never a fabricated date/time/price).
import { BookingProvider } from '@/lib/booking-context';
import type { SelectedService } from '@/lib/booking-state';
import { getPaymentStepDataA } from './getPaymentStepDataA';
import PaymentStepReviewA from './PaymentStepReviewA';

export default async function PaymentStepDirectionA() {
  const data = await getPaymentStepDataA();

  if (!data) {
    return (
      <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
        The seed salon (muse-beauty-studio) or its cheapest service could not be loaded. See
        the server console for the query that failed.
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
      <div className="min-h-screen bg-white">
        <main className="max-w-2xl mx-auto px-4 pt-3">
          <PaymentStepReviewA
            salon={data.salon}
            staff={data.staff}
            isLoggedIn={data.isLoggedIn}
            salonHasRedeemableVoucher={data.salonHasRedeemableVoucher}
          />
        </main>
      </div>
    </BookingProvider>
  );
}
