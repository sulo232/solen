/**
 * Direction C (What happens next) server wrapper for
 * /dev/directions-0905/confirmation?v=c.
 *
 * Grounded-in: app/[locale]/confirmation/page.tsx (the real route this direction rebuilds),
 * components-legacy/booking/BookingConfirmation.tsx (671 lines, the real screen: the same
 * BookingConfirmationProps shape flows through this file unchanged).
 *
 * Exists-check: `npm run exists confirmation` (this turn) -> the real route
 * (app/[locale]/confirmation/page.tsx) + BookingConfirmation.tsx (671 lines, the real
 * screen this direction is a treatment/structure exploration of, never a from-scratch
 * redraw: every field below reads the SAME BookingConfirmationProps shape that real
 * component takes). `npm run exists directions-0905` -> 1 REMOVED hit (the 2026-09-04
 * single-treatment batch, a format rejection, not this whole-screen exploration) + the
 * shared DirectionFrame (reused unchanged by page.tsx, not this file). Net-new: this
 * server wrapper and its sibling client component, ConfirmationCelebration.tsx.
 *
 * Depicts: booking data -> app/[locale]/confirmation/page.tsx
 * Depicts: booking prop shape -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: cancellation window hours -> components-legacy/booking/PayConfirmStep.tsx
 * Depicts: no-booking fallback text -> NET-NEW: honest "nothing found" state, never a fabricated booking
 *
 * Fetches the SAME real booking `getSeedBooking()` resolves for the other two directions
 * of this surface (shared, off-limits _shared/seedBooking.ts, not forked) plus one small
 * net-new loader (./getCancellationInfo.ts) for the real per-salon cancellation window,
 * since seedBooking's BOOKING_SELECT does not carry that column (confirmed by reading it).
 */
import { getSeedBooking } from "../../_shared/seedBooking";
import { getCancellationInfo } from "./getCancellationInfo";
import { ConfirmationCelebration } from "./ConfirmationCelebration";

export default async function ConfirmationDirectionC({ locale }: { locale: string }) {
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

  return <ConfirmationCelebration booking={booking} freeCancelHours={freeCancelHours} locale={locale} />;
}
