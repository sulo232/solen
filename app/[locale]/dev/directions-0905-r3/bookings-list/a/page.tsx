// Round 3, Candidate A, Bookings list. Thin server component: load the real booking buckets,
// hand them to BookingsListA. No chrome of its own: the shared /dev layout strips the real
// Header/BottomNav on every /dev path, matching every other round-3 mockup route.
//
// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none of them a bookings-list page for this round. No round-3 bookings-list route existed before
// this build.
//
// Grounded-in: app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts
// Depicts: the whole screen's data source -> app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts (real upcoming/past buckets, no fabricated rows)

import { loadBookingsA } from "@/app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA";
import BookingsListA from "./BookingsListA";

export default async function BookingsListR3APage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { upcoming, past } = await loadBookingsA();
  return <BookingsListA locale={locale} upcoming={upcoming} past={past} />;
}
