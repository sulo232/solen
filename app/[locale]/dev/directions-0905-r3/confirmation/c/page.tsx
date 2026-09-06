// Exists-check: `npm run exists directions-0905-r3` (run this turn) lists several sibling
// round-3 screen folders already on disk and 7 REMOVED hits, none of them a confirmation
// surface. `npm run exists confirmation` surfaces the real route + BookingConfirmation.tsx
// (671 lines), the same real surface this file is Candidate C's treatment of. This route is
// folder-scoped to Candidate C only (no query-param switcher), matching how the sibling
// candidates a/ and b/ in this same parent folder are built.
//
// Grounded-in: components-legacy/booking/BookingConfirmation.tsx (payment-truth derivation, the
// .ics technique, the Google-Maps directions query) and the two prior round-2 confirmation client
// views (RuleConfirmationView.tsx and LiftConfirmationView.tsx, both read in full this session;
// this file is a new build against Candidate C's own value sheet, never a copy of either). The
// loaders below are IMPORTED from their real, shared locations, never duplicated. The one
// exception is the salon-photo swap at the bottom of this file: tested live this session, writing
// the literal name of the round-2 kit's own parent folder anywhere in a file under
// app/**/dev/**/*.tsx trips this repo's PreToolUse mockup-content gate (it treats that folder-name
// token as a graveyarded keyword and blocks the write with exit 2, confirmed by running the gate
// directly against a one-line test file before writing this one), so importing a sibling
// candidate's own private per-treatment utility from inside that folder is not viable here without
// spelling out the path in a comment. The two existing round-2 siblings already independently
// solved this same banned-photo problem with their own small local swap (one reads
// salons.gallery_urls, the other salon_portfolio_images), so reproducing the same ~15-line pattern
// a third time, scoped to this file, matches established practice rather than inventing a new one.
//
// Depicts: routing -> NET-NEW: this route is folder-scoped to Candidate C only, one folder per
// candidate per this build's own brief.
// Depicts: booking data -> app/[locale]/dev/directions-0905/_shared/seedBooking.ts (the real,
// live, confirmed booking row, imported not copied).
// Depicts: cancellation window hours -> app/[locale]/dev/directions-0905/confirmation/_vc/getCancellationInfo.ts
// (imported not copied).
// Depicts: the salon-photo swap -> NET-NEW: scoped to this file only, see the note above for why
// it is not imported from its closest existing equivalent.

import { createAdminSupabaseClient } from "@/lib/supabase";
import { getSeedBooking } from "../../../directions-0905/_shared/seedBooking";
import { getCancellationInfo } from "../../../directions-0905/confirmation/_vc/getCancellationInfo";
import { AirbnbConfirmationView } from "./AirbnbConfirmationView";

const BANNED_GREYSCALE_PHOTO_ID = "photo-1560066984";

/** Same salon, a different real photo of it, only when the resolved cover happens to be the one
 * greyscale seed asset this round does not use. Never invents a photo: reads the SAME salon's own
 * `gallery_urls` column and falls back to the original cover if every entry is the banned asset
 * (or the column is empty), so a real photo of the real booked salon always renders. */
async function getRealCoverPhoto(salonId: string, fallback: string | null): Promise<string | null> {
  if (!fallback?.includes(BANNED_GREYSCALE_PHOTO_ID)) return fallback;
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.from("salons").select("gallery_urls").eq("id", salonId).maybeSingle();
  const gallery = (data?.gallery_urls as string[] | null) ?? [];
  return gallery.find((url) => !url.includes(BANNED_GREYSCALE_PHOTO_ID)) ?? fallback;
}

export default async function ConfirmationCPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const booking = await getSeedBooking(locale);

  if (!booking) {
    // Never invented: the DB genuinely had no confirmed booking to seed this mockup with.
    return (
      <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
        No confirmed booking exists in the seed data for this mockup.
      </div>
    );
  }

  const [{ freeCancelHours }, coverUrl] = await Promise.all([
    getCancellationInfo(booking.salonId),
    getRealCoverPhoto(booking.salonId, booking.salonCoverUrl),
  ]);

  return (
    <AirbnbConfirmationView booking={booking} freeCancelHours={freeCancelHours} coverUrl={coverUrl} locale={locale} />
  );
}
