// Grounded-in: app/[locale]/salon/[slug]/booking/page.tsx (this server component mirrors
// that real route's data-fetch + BookingProvider wiring, trimmed to the fixed seed salon and
// with the query-param prefill parsing dropped, per this fan-out's brief).
//
// Exists-check: `npm run exists booking-steps` -> 1 REMOVED hit (NailBookingSteps, unrelated).
// `npm run exists BookingProvider` -> 1 hit, the real context provider imported below,
// unchanged, off-limits (lib/**).
//
// Depicts: the wrapped wizard + its data -> app/[locale]/salon/[slug]/booking/page.tsx (real route this mirrors) and ./BookingWizardSlideStack.tsx (this direction's own copy)
// Depicts: white page shell + max-w-2xl content column -> app/[locale]/salon/[slug]/booking/page.tsx (same `min-h-screen bg-white` / `max-w-2xl mx-auto px-4 pt-3 pb-6` wrapper, copied unchanged)
// Depicts: preselecting the cheapest real service so Continue is enabled on load -> NET-NEW: reuses the real initialServices prop BookingProvider already exposes for a service deep link, supplied with a fetched id instead of a query param, so the recorded demo video has a working first click
//
// Server component: fetches the real muse-beauty-studio salon + services + staff (this
// surface's own `./getBookingWizardDataA.ts`, not a sibling direction's data file), then
// renders the real `<BookingProvider>` around this direction's own wizard copy
// (`./BookingWizardSlideStack.tsx`). The cheapest real service is preselected into the cart
// (via `initialServices`, the same prop the real booking page uses for a ?service= deep
// link) so the first-paint "Continue" button is enabled, which is what the recorded video's
// click action needs to actually trigger a step change; never a fabricated price, it is the
// real cheapest row for this salon.
import { BookingProvider } from '@/lib/booking-context';
import BookingWizardSlideStack from './BookingWizardSlideStack';
import { getBookingWizardDataA } from './getBookingWizardDataA';

export default async function BookingStepsDirectionA() {
  const data = await getBookingWizardDataA();

  if (!data) {
    return (
      <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
        The seed salon (muse-beauty-studio) or its services could not be loaded. See the
        server console for the query that failed.
      </div>
    );
  }

  if (data.services.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
        muse-beauty-studio has no active services right now, so the booking wizard has
        nothing to show.
      </div>
    );
  }

  const initialServices = data.cheapestService
    ? [
        {
          id: data.cheapestService.id,
          name_de: data.cheapestService.name_de,
          name_en: data.cheapestService.name_en,
          price: data.cheapestService.price,
          duration_minutes: data.cheapestService.duration_minutes,
        },
      ]
    : undefined;

  return (
    <BookingProvider salonId={data.salon.id} initialServices={initialServices}>
      <div className="min-h-screen bg-white">
        <main className="max-w-2xl mx-auto px-4 pt-3 pb-6">
          <BookingWizardSlideStack
            services={data.services}
            staffList={data.staffList}
            salon={data.salon}
            staffServices={data.staffServices}
            serviceAddons={data.serviceAddons}
            serviceOptions={data.serviceOptions}
            isLoggedIn={data.isLoggedIn}
            salonHasRedeemableVoucher={data.salonHasRedeemableVoucher}
          />
        </main>
      </div>
    </BookingProvider>
  );
}
