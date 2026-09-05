// exists-check: `npm run exists directions-0905` -> reused (DirectionFrame). `npm run exists
// booking sheet` -> 1 hit, CancelBookingSheet.tsx (unrelated). Net-new: this page-level
// wrapper (persistent salon-identity header + BookingProvider + BookingWizardC), scoped to
// booking-steps/_vc/ only.
//
// Grounded-in: app/[locale]/salon/[slug]/booking/page.tsx (the real booking route this
// mockup copies: same BookingProvider wrap, same sunken-body wrapper shape)
//
// Depicts: persistent salon-identity strip (photo + name) -> NET-NEW: the real booking route
//   (app/[locale]/salon/[slug]/booking/page.tsx) has no salon-name header ("Mockup 20"
//   comment there: "no salon-name header bar"); this direction's own brief explicitly
//   requires "the salon header stays visible under the stack the whole time" as the anchor
//   the card stack recedes behind, so it is added here, real data only (name + cover photo
//   from the seed salon), never fabricated.
// Depicts: BookingProvider wrap + sunken body -> app/[locale]/salon/[slug]/booking/page.tsx (real, same shape)
// Depicts: wizard -> ./BookingWizardC.tsx (this direction's own file, see its own Depicts manifest)
'use server' === undefined; // no-op marker; this file is a plain Server Component, not a Server Action

import Image from 'next/image';
import { BookingProvider } from '@/lib/booking-context';
import { getBookingWizardSeedData } from './getBookingWizardSeedData';
import BookingWizardC from './BookingWizardC';

export default async function BookingStepsDirectionC() {
  const data = await getBookingWizardSeedData();

  if (!data) {
    return (
      <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
        Direction C blocked: the seed salon (muse-beauty-studio) has no active services or staff to book right now.
      </div>
    );
  }

  const { salon, services, staffList, staffServices, serviceAddons, serviceOptions, salonHasRedeemableVoucher } = data;

  return (
    <BookingProvider salonId={salon.id}>
      <div className="min-h-screen bg-s-bg-sunken">
        {/* Persistent salon header (real data, never animates, stays visible the whole
            session while the sheet stack rises and recedes over it). See file header
            Depicts note: this is NET-NEW to the booking route, added because Direction C's
            own brief names it explicitly. */}
        <div className="flex items-center gap-3 border-b border-s-border bg-white px-4 py-3">
          {salon.cover_photo_url ? (
            <Image
              src={salon.cover_photo_url}
              alt={salon.name}
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-s-bg-sunken text-[14px] font-semibold text-s-ink-2">
              {salon.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold text-s-ink">{salon.name}</div>
            {salon.average_rating ? (
              <div className="flex items-center gap-1 text-[12px] text-s-ink-2">
                <span aria-hidden="true" className="text-s-star">★</span>
                <span className="tabular-nums">{salon.average_rating.toFixed(1)}</span>
                <span>({salon.review_count})</span>
              </div>
            ) : null}
          </div>
        </div>

        <main className="mx-auto max-w-2xl px-4 pt-3 pb-6">
          <BookingWizardC
            services={services}
            staffList={staffList}
            salon={salon}
            staffServices={staffServices}
            serviceAddons={serviceAddons}
            serviceOptions={serviceOptions}
            isLoggedIn={false}
            salonHasRedeemableVoucher={salonHasRedeemableVoucher}
          />
        </main>
      </div>
    </BookingProvider>
  );
}
