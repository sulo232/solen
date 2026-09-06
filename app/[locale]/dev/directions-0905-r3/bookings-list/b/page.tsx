// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none of them this screen or a bookings-list page: a grey-band canvas system, three killed home
// structures, a killed set of empty-bookings/saved/search directions, a killed search heading
// line, a killed review count, a killed component-isolation preview route, and a killed
// service-row book-button harness. No bookings-list "b" page existed before this file.
//
// Grounded-in: BookingsListB.tsx carries the full grounding trail (the previous round's LIFT view
// this screen extends by hand, and the Fresha placement source); this file is only the
// data-loading shell, the same shape the sibling switcher for this screen already used one round
// back (read params, call the real loader, hand the result to the screen's own view, no chrome).
//
// Depicts: page shell (data load, no chrome of its own) -> ./BookingsListB.tsx (renders
// everything; this file only awaits params and the real loader)
//
// No chrome of its own: HideInBooking.tsx strips the real Header/BottomNav/consent bar on every
// /dev route in this project; this file draws no header, bar or nav, and BookingsListB.tsx
// reproduces the bottom-nav's own height with a spacer, never a redraw.
//
// system: b (CANDIDATE B, LIFT REFINED, _plans/R3_ONE_SYSTEM.md). <KitProvider system="b"> wraps
// the tree inside BookingsListB.tsx.

import { loadBookingsA } from "../../../directions-0905/bookings-list/_va/loadBookingsA";
import { BookingsListB } from "./BookingsListB";

export default async function BookingsListR3BPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { upcoming, past } = await loadBookingsA();
  return <BookingsListB locale={locale} upcoming={upcoming} past={past} />;
}
