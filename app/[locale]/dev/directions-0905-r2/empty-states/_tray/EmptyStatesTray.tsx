// Exists-check: `npm run exists "empty-states r2 tray"` (this session) returns 0 matches; no
// round-2 empty-states server wrapper existed before this file. `npm run exists empty` earlier
// this session surfaced the inline empty-query sections on /inspo, /inspo/saved, /dev/map-browse
// plus the shared EmptyState/EmptyServicesState/DiscoveryEmptyState/EmptyStateDiscovery/FlowEmpty
// components (none of them this surface) and round-1's own
// app/[locale]/dev/directions-0905/empty-states/{page.tsx,_va,_vb,_vc} (the surface this build is
// the round-2 TRAY-system treatment of).
//
// Depicts: the whole surface's real data -> app/[locale]/dev/directions-0905/empty-states/_vc/loadDirectionC.ts
// (getDirectionCData, IMPORTED not copied, the same real per-table loader round-1's own Direction C
// already built and reads: seed customer kunde@solen.ch's real favorites/looks-adjacent tables).
//
// REPAIR (critic pass 2026-09-06): this build used to consume two of getDirectionCData's four
// fields (nearbySalons, looks). `nearbySalons` is dropped in this pass: its only consumer, the
// favorites real-content rail, composed the real, registered SalonCard, whose HeartButton bakes
// in a border+shadow combination the round-2 cross-system rule bans with no exception (see
// EmptyStatesTrayView.tsx's own REPAIR note for the full account); that rail is removed rather
// than patched, since SalonCard carries no prop to suppress its own HeartButton. This build now
// consumes only one of getDirectionCData's four fields (looks); rebookBookings, referral and
// nearbySalons are all left unused here since every state but Looks stays a pure empty unit with
// no real-content rail (see EmptyStatesTrayView.tsx's own header for why).
//
// Grounded-in: app/[locale]/dev/directions-0905/empty-states/_vc/loadDirectionC.ts (the loader),
// components-legacy/booking/BookingsList.tsx, app/[locale]/profile/favorites/page.tsx,
// app/[locale]/profile/vouchers/page.tsx, app/[locale]/profile/looks/page.tsx (the four real
// render sites this surface depicts, same four the round-1 _vb file already traced).
import { getDirectionCData } from "../../../directions-0905/empty-states/_vc/loadDirectionC";
import { EmptyStatesTrayView } from "./EmptyStatesTrayView";

export default async function EmptyStatesTray({ locale }: { locale: string }) {
  const data = await getDirectionCData(locale);
  return <EmptyStatesTrayView looks={data.looks} />;
}
