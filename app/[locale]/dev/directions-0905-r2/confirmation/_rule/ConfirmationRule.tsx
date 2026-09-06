// Exists-check: `npm run exists confirmation` (this session) surfaces the real route
// (app/[locale]/confirmation/page.tsx) + BookingConfirmation.tsx (671 lines), the same real
// surface round-1's Direction C already treated, and the round-1 folder this file starts from
// and imports off, never copies. `npm run exists "directions-0905-r2 confirmation"` (this
// session) found the sibling _lift server wrapper already on disk (this route's page.tsx is
// shared across the three look-system builders per the orchestrator brief), no existing _rule
// folder before this file.
//
// Depicts: booking data -> app/[locale]/dev/directions-0905/_shared/seedBooking.ts
// (getSeedBooking, IMPORTED not copied, the same shared loader every round-1 confirmation
// direction and the sibling round-2 _lift builder read)
// Depicts: cancellation window hours -> app/[locale]/dev/directions-0905/confirmation/_vc/getCancellationInfo.ts
// (IMPORTED not copied)
// Depicts: the real cover photo, swapped for a non-banned real photo of the SAME salon ->
// ./getAlternateCoverPhoto.ts (net-new, this folder, see that file's own header for why)
// Depicts: no-booking fallback text -> NET-NEW: honest "nothing found" state, never a fabricated
// booking, same wording round-1's ConfirmationDirectionC.tsx and the sibling _lift wrapper use
//
// Grounded-in: app/[locale]/dev/directions-0905/confirmation/_vc/ConfirmationDirectionC.tsx (the
// server-wrapper shape this file follows: fetch the seed booking, fetch cancellation info, hand
// both to the render layer). RuleConfirmationView.tsx (the client component below) is a new file
// built against the round-2 kit in system "rule", never a copy of round-1's
// ConfirmationCelebration.tsx.

import { getSeedBooking } from "../../../directions-0905/_shared/seedBooking";
import { getCancellationInfo } from "../../../directions-0905/confirmation/_vc/getCancellationInfo";
import { getAlternateCoverPhoto } from "./getAlternateCoverPhoto";
import { RuleConfirmationView } from "./RuleConfirmationView";

export default async function ConfirmationRule({ locale }: { locale: string }) {
  const booking = await getSeedBooking(locale);

  if (!booking) {
    // Never fabricated: the DB genuinely had (and could not seed) a confirmed booking.
    return (
      <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
        No confirmed booking exists in the seed data for this mockup.
      </div>
    );
  }

  const [{ freeCancelHours }, coverUrl] = await Promise.all([
    getCancellationInfo(booking.salonId),
    getAlternateCoverPhoto(booking.salonId, booking.salonCoverUrl),
  ]);

  return (
    <RuleConfirmationView booking={booking} freeCancelHours={freeCancelHours} coverUrl={coverUrl} locale={locale} />
  );
}
