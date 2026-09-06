// Exists-check: `npm run exists "directions-0905-r2 confirmation"` and `npm run exists
// "confirmation lift r2"` (both run this turn) return 0 matches. `npm run exists confirmation`
// (this turn) surfaces the real route (app/[locale]/confirmation/page.tsx) +
// BookingConfirmation.tsx (671 lines), the same real surface round-1's Direction C already
// treated, and the round-1 folder this file starts from and imports off, never copies.
//
// Depicts: booking data -> app/[locale]/dev/directions-0905/_shared/seedBooking.ts
// (getSeedBooking, IMPORTED not copied, the same shared loader every round-1 confirmation
// direction reads)
// Depicts: cancellation window hours -> app/[locale]/dev/directions-0905/confirmation/_vc/getCancellationInfo.ts
// (IMPORTED not copied, round-1 Direction C's own small net-new loader for
// salons.cancellation_window_hours, since seedBooking's BOOKING_SELECT does not carry that
// column)
// Depicts: no-booking fallback text -> NET-NEW: honest "nothing found" state, never a fabricated
// booking, same wording round-1's ConfirmationDirectionC.tsx already used
//
// Grounded-in: app/[locale]/dev/directions-0905/confirmation/_vc/ConfirmationDirectionC.tsx
// (the server-wrapper shape this file follows: fetch the seed booking, fetch cancellation info,
// hand both to the client view). This is the ROUND-2 LIFT reskin of that same real surface, not
// a duplicate: LiftConfirmationView.tsx (the client component below) is a new file built against
// the round-2 kit, never a copy of round-1's ConfirmationCelebration.tsx.

import { getSeedBooking } from "../../../directions-0905/_shared/seedBooking";
import { getCancellationInfo } from "../../../directions-0905/confirmation/_vc/getCancellationInfo";
import { getAlternatePhoto, BANNED_GREYSCALE_PHOTO_ID } from "./getAlternatePhoto";
import { LiftConfirmationView } from "./LiftConfirmationView";

export default async function ConfirmationLift({ locale }: { locale: string }) {
  const booking = await getSeedBooking(locale);

  if (!booking) {
    // Never fabricated: the DB genuinely had (and could not seed) a confirmed booking.
    return (
      <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
        No confirmed booking exists in the seed data for this mockup.
      </div>
    );
  }

  const { freeCancelHours } = await getCancellationInfo(booking.salonId);

  // CONFLICT C10: getSeedBooking() (shared, unedited) resolved a booking whose own
  // cover_photo_url is the banned greyscale seed photo. Rather than showing no photo at all for
  // a screen that has one to show, look up one more of the SAME salon's real portfolio photos
  // (see getAlternatePhoto.ts's own header for why this is not a fork of the shared loader).
  const bookingForView = booking.salonCoverUrl?.includes(BANNED_GREYSCALE_PHOTO_ID)
    ? { ...booking, salonCoverUrl: (await getAlternatePhoto(booking.salonId)) ?? booking.salonCoverUrl }
    : booking;

  return <LiftConfirmationView booking={bookingForView} freeCancelHours={freeCancelHours} locale={locale} />;
}
