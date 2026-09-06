// Exists-check: `npm run exists confirmation` (run this session) surfaces the real route
// (app/[locale]/confirmation/page.tsx) + BookingConfirmation.tsx (671 lines), the same real
// surface round-1's Direction C already treated, and the round-1 folder this file starts from
// and imports off, never copies. The same run also surfaced the sibling round-2 builders already
// on disk: _lift/ConfirmationLift.tsx (the shared page.tsx router, ?s=lift wired) and
// _rule/ConfirmationRule.tsx + _rule/getAlternateCoverPhoto.ts. This file is the TRAY sibling of
// those two, reusing the same real loaders they both already reuse.
//
// Depicts: booking data -> app/[locale]/dev/directions-0905/_shared/seedBooking.ts
// (getSeedBooking, IMPORTED not copied, the same shared loader every round-1 confirmation
// direction and both sibling round-2 builders read).
// Depicts: cancellation window hours -> app/[locale]/dev/directions-0905/confirmation/_vc/getCancellationInfo.ts
// (IMPORTED not copied; round-1 Direction C's own small net-new loader for
// salons.cancellation_window_hours, since seedBooking's BOOKING_SELECT does not carry it).
// Depicts: the real cover photo, swapped for a non-banned photo of the same salon -> ../_rule/getAlternateCoverPhoto.ts
// (found via this session's exists-check, REUSED not duplicated: the sibling _rule builder
// already solved the identical problem this booking's own data creates, see that file's own
// header for the full why. Queried directly this session, scratchpad/r2/check-booking.mjs: the
// real, shared getSeedBooking() resolves to the salon "Atelier Haarwerk"
// (dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89) whose cover_photo_url is exactly photo-1560066984, the
// greyscale hash the orchestrator brief names as banned. Reusing the sibling's loader instead of
// writing a third copy of the same fix keeps this repeated pattern in one place, per CLAUDE.md
// rule 12, "improve what exists, don't duplicate.")
//
// Grounded-in: app/[locale]/confirmation/page.tsx -> components-legacy/booking/BookingConfirmation.tsx
// (671 lines, BookingConfirmationProps), the real route+component the task brief names ("the
// real route and loader"), which is what seedBooking.ts itself mirrors (its own header says so)
// and what round-1's three directions and both sibling round-2 builders (_lift, _rule) render
// against. This server wrapper follows the exact same fetch-then-render shape as
// app/[locale]/dev/directions-0905/confirmation/_vc/ConfirmationDirectionC.tsx and the sibling
// _lift/ConfirmationLift.tsx / _rule/ConfirmationRule.tsx wrappers.
import { getSeedBooking } from "../../../directions-0905/_shared/seedBooking";
import { getCancellationInfo } from "../../../directions-0905/confirmation/_vc/getCancellationInfo";
import { getAlternateCoverPhoto } from "../_rule/getAlternateCoverPhoto";
import { ConfirmationTrayView } from "./ConfirmationTrayView";

export default async function ConfirmationTray({ locale }: { locale: string }) {
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
    <ConfirmationTrayView booking={booking} freeCancelHours={freeCancelHours} coverUrl={coverUrl} locale={locale} />
  );
}
