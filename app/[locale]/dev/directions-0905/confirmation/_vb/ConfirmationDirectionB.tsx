// Exists-check: `npm run exists seedBooking` -> the shared server loader
// (../../_shared/seedBooking.ts), reused unchanged, not forked (its own header names it
// server-only, admin-client, per-process cached; this file just calls it). `npm run exists
// confirmation` -> BookingConfirmation.tsx (671 lines, the real screen), reused for its
// exact ICS-download logic (handleCalendar) and its Google-Maps directions-href pattern,
// both copied verbatim into TicketCardB.tsx rather than re-derived. `npm run exists
// Avatar` / `SuccessMark` -> both real, reused unchanged.
//
// Grounded-in: components-legacy/booking/BookingConfirmation.tsx (the real screen this
// direction restructures), app/[locale]/confirmation/page.tsx (the real route's
// BOOKING_SELECT, same shape ../../_shared/seedBooking.ts mirrors), ../../_shared/seedBooking.ts
// (the real-data loader, reused unchanged, not forked).
//
// Depicts: booking data -> app/[locale]/dev/directions-0905/_shared/seedBooking.ts getSeedBooking()
// Depicts: ticket status/date/salon/service/staff/price rows -> components-legacy/booking/BookingConfirmation.tsx (same props, reordered)
// Depicts: ICS download + directions link -> components-legacy/booking/BookingConfirmation.tsx handleCalendar/directionsHref
// Depicts: success mark entrance -> app/[locale]/_components/primitives/SuccessMark.tsx
// Depicts: card radius/shadow -> app/tailwind.config.js rounded-card + shadow-elevation-2 tokens
// Depicts: perforated tear line -> NET-NEW: brief's own direction names this element, no cited Fresha/Airbnb file draws it
// Depicts: icon-label action row -> NET-NEW: composes Fresha's action-row content into a 3-up row per this direction's brief line
import { getSeedBooking } from "../../_shared/seedBooking";
import TicketCardB from "./TicketCardB";

export default async function ConfirmationDirectionB({ locale }: { locale: string }) {
  const booking = await getSeedBooking(locale);

  if (!booking) {
    return (
      <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
        No confirmed booking found in the live database for this mockup (getSeedBooking
        returned null). Not fabricated: nothing renders here until a real row exists.
      </div>
    );
  }

  return <TicketCardB booking={booking} locale={locale} />;
}
