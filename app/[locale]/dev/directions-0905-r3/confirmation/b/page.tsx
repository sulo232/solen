// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// all owner-rejected round-2 surfaces unrelated to a confirmation receipt (a grey-band look
// system, three home-feed layouts, a set of empty-state treatments, a search-results heading
// line, a review-count display, an isolated component-preview switcher, and one booking-flow
// button harness); none names or governs this screen. `npm run exists confirmation` (this
// session) surfaces the real route (app/[locale]/confirmation/page.tsx) +
// BookingConfirmation.tsx (671 lines) and the shared loaders this file imports off (never
// copies): the shared seed-booking loader and cancellation-window loader from round 1's own
// confirmation exploration, plus the real portfolio-photo loader re-exported through ./loaders.ts.
// This file is net-new: no round-3 candidate-B confirmation server wrapper exists yet.
//
// Depicts: booking data -> app/[locale]/dev/directions-0905/_shared/seedBooking.ts
// (getSeedBooking, IMPORTED not copied, the same shared loader every confirmation exploration
// reads across every round)
// Depicts: cancellation window hours -> app/[locale]/dev/directions-0905/confirmation/_vc/getCancellationInfo.ts
// (IMPORTED not copied)
// Depicts: a non-banned real photo for the booked salon -> ./loaders.ts, re-exporting round 2's
// own LIFT confirmation builder's real query over salon_portfolio_images (IMPORTED not copied,
// never a hardcoded src)
//
// Grounded-in: app/[locale]/dev/directions-0905/confirmation/_vc/ConfirmationCelebration.tsx
// (round 1's own declared section order, carried forward through every later confirmation
// exploration) and the LIFT confirmation build from round 2 (the server-wrapper shape THIS file
// follows: fetch the seed booking, fetch cancellation info, swap the banned greyscale photo for a
// real alternate, hand all three to the client view). This is round 3's Candidate-B refinement of
// that same real surface, never a copy: the client view below (ConfirmationCandidateBView.tsx) is
// a new file built against the round-3 kit surface and the R3_ONE_SYSTEM.md Candidate B value
// sheet, not a copy of any earlier round's view file.

import { getSeedBooking } from "../../../directions-0905/_shared/seedBooking";
import { getCancellationInfo } from "../../../directions-0905/confirmation/_vc/getCancellationInfo";
import { getAlternatePhoto, BANNED_GREYSCALE_PHOTO_ID } from "./loaders";
import { ConfirmationCandidateBView } from "./ConfirmationCandidateBView";

export default async function ConfirmationCandidateBPage({
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

  const { freeCancelHours } = await getCancellationInfo(booking.salonId);

  // Same substitution the shared loader's own callers already apply: getSeedBooking() (shared,
  // unedited) can resolve a booking whose own cover_photo_url is the banned greyscale seed photo.
  // Rather than showing no photo at all for a screen whose whole hero treatment is that photo,
  // look up one more of the SAME salon's real portfolio photos.
  const bookingForView = booking.salonCoverUrl?.includes(BANNED_GREYSCALE_PHOTO_ID)
    ? { ...booking, salonCoverUrl: (await getAlternatePhoto(booking.salonId)) ?? booking.salonCoverUrl }
    : booking;

  return <ConfirmationCandidateBView booking={bookingForView} freeCancelHours={freeCancelHours} locale={locale} />;
}
