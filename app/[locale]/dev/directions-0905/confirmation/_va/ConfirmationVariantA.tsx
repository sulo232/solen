// Exists-check: `npm run exists directions-0905` -> 1 graveyard hit, an earlier single-treatment
// comparison batch under a different dev route, rejected by the owner as a FORMAT; not re-proposed
// here (this is the newly-requested three-genuinely-different-directions format). Also hit:
// DirectionFrame (shared scaffold, reused unchanged by page.tsx, not touched here).
// `npm run exists confirmation` -> app/[locale]/confirmation/page.tsx (real route),
// components-legacy/booking/BookingConfirmation.tsx (671 lines, the real screen this direction is
// a COPY of), plus a few unrelated components elsewhere named "Confirmation" for other flows
// (report-flow, a tip flow), none of which is this comparison surface.
// `getSeedBooking` (../../_shared/seedBooking.ts) already exists and is reused unchanged
// (off-limits, shared file per the brief).
//
// Grounded-in: app/[locale]/confirmation/page.tsx (the real route this fetch mirrors) and
// components-legacy/booking/BookingConfirmation.tsx (the real 671-line screen this direction's
// view component is a structural copy of, see ConfirmationVariantAView.tsx's own header).
//
// Depicts: booking data -> app/[locale]/dev/directions-0905/_shared/seedBooking.ts (`getSeedBooking`,
//   reused unchanged, real confirmed+paid booking off the live DB).
// Depicts: free-cancel-hours read -> ./cancellationHours.ts (net-new, this folder; see its own
//   header for the cancellation_window_hours vs free_cancel_hours drift this surfaced).
// Depicts: the actual screen -> ./ConfirmationVariantAView.tsx (this file only fetches data and
//   hands it to that client component; see its own header for the full anatomy + motion Depicts).
//
// Server component: fetches real data, never renders UI of its own beyond the "no data" fallback
// (never a fabricated placeholder booking).
import { getSeedBooking } from "../../_shared/seedBooking";
import { getFreeCancelHours } from "./cancellationHours";
import ConfirmationVariantAView from "./ConfirmationVariantAView";

export default async function ConfirmationVariantA({ locale }: { locale: string }) {
  const booking = await getSeedBooking(locale);

  if (!booking) {
    return (
      <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
        No confirmed booking with a salon, service and staff member exists in the live database
        right now, so this direction has nothing real to render (never fabricated).
      </div>
    );
  }

  const freeCancelHours = await getFreeCancelHours(booking.salonId);

  return <ConfirmationVariantAView booking={booking} freeCancelHours={freeCancelHours} locale={locale} />;
}
