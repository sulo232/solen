// exists-check: net-new vs app/[locale]/salon/[slug]/booking/page.tsx (the real booking page
// this wrapper mirrors the data query of, deep-link prefill parsing dropped since this mockup
// route receives no ?staff=/?service=/?date= params). `npm run exists BookingDirectionB` -> 0,
// net-new (this file). `npm run exists BookingProvider` -> real, lib/booking-context.tsx,
// reused unchanged below, not forked.
//
// Grounded-in: app/[locale]/salon/[slug]/booking/page.tsx (the real server page this wrapper
// is a trimmed copy of the data-fetching half of; the wizard half is BookingWizardB.tsx, a
// sibling file's own sanctioned copy of components-legacy/booking/BookingWizard.tsx).
//
// Depicts: real salon + services + staff data for muse-beauty-studio -> ./getBookingWizardData.ts (net-new loader, mirrors the real page's own query).
// Depicts: BookingProvider wrapping -> lib/booking-context.tsx (reused unchanged, not forked).
// Depicts: the wizard itself -> ./BookingWizardB.tsx (this direction's own sanctioned copy, see that file's Depicts manifest).
//
// Server component: fetches the real muse-beauty-studio salon (the same salon this whole
// directions-0905 booking-steps surface is scoped to per the brief) and renders the direction B
// wizard inside the real BookingProvider, so useBooking()/goToStep work exactly as they do on
// the live booking page.

import { BookingProvider } from "@/lib/booking-context";
import { getBookingWizardData } from "./getBookingWizardData";
import BookingWizardB from "./BookingWizardB";

export default async function BookingDirectionB() {
  const data = await getBookingWizardData();

  if (!data) {
    return (
      <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
        No bookable services found for muse-beauty-studio right now.
      </div>
    );
  }

  return (
    <BookingProvider salonId={data.salon.id}>
      <div className="min-h-screen bg-white">
        <main className="mx-auto max-w-2xl px-4 pb-6 pt-3">
          <BookingWizardB
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
