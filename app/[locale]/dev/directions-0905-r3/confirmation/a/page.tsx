// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 owner-rejected
// round-2 hits from the 2026-09-06 pass (see `_design-system/REMOVED.md` for the full list),
// none of them a confirmation route or a kit/component module. `npm run exists confirmation` (run
// this session) surfaces the real route + the 671-line BookingConfirmation.tsx (both cited below),
// and the round-2 sibling confirmation builds this file refines. No existing round-3
// confirmation/a route before this file.
//
// Grounded-in: app/[locale]/confirmation/page.tsx (the real production confirmation route: same
// booking select shape, same components-legacy/booking/BookingConfirmation.tsx props this file's
// own seed loader mirrors). This screen's server-wrapper shape (fetch the seed booking, fetch
// cancellation info, fetch the alternate cover photo, hand all three to the render layer) follows
// this round's own confirmation base one folder over from this route's own tree; see ./data.ts's
// header for the exact sibling paths and why the imports live in a plain .ts loader.
//
// Depicts: booking data, cancellation window, cover photo -> ./data.ts (this folder's own
// re-export barrel; see that file's header for the exact real loader paths).
// Depicts: no-booking fallback text -> NET-NEW: an honest "nothing found" state for the genuine
// case where the seed data has no confirmed booking, never a fabricated one; wording matches this
// round's own confirmation base's identical fallback.
//
// AConfirmationView.tsx (the client component below) is Candidate A's own refinement of that
// base's view layer, built against `_plans/R3_ONE_SYSTEM.md`'s Candidate A value sheet, never a
// byte-for-byte copy; see that file's own header for the full fix-list trace.

import { getSeedBooking, getCancellationInfo, getAlternateCoverPhoto } from "./data";
import { AConfirmationView } from "./AConfirmationView";

export default async function ConfirmationRoundThreeA({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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
    <AConfirmationView booking={booking} freeCancelHours={freeCancelHours} coverUrl={coverUrl} locale={locale} />
  );
}
