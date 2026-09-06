// exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none of them a page shell: a grey-band whole-canvas system, three killed home structures, a
// killed set of prior empty-bookings/saved/looks/vouchers directions (this screen's own prior
// round), a killed search heading line, a killed review count, a killed component-isolation
// preview route, and a killed service-row book-button harness. No candidate-B build of this
// screen existed before this file.
//
// Grounded-in: ./EmptyStatesB.tsx (carries the full grounding trail: real copy keys, the real
// Supabase-backed rail, and the Fresha/Airbnb placement sources named in this builder's own
// return). This file is only the data-loading shell, the same thin-server-component shape this
// project's own sibling screens for this round already use: read params, call the real loader,
// hand the result to the screen's own view, no chrome.
//
// Depicts: page shell (locale param only, no chrome of its own) -> ./EmptyStatesB.tsx (renders
// everything real this screen depicts)
//
// No chrome of its own: this project's layout strips the real header, bottom nav and consent bar
// on every /dev route; this file draws no header, bar or nav, and EmptyStatesB.tsx reproduces
// the bottom nav's own height with a spacer, never a redraw.
//
// system: b (CANDIDATE B, LIFT REFINED, _plans/R3_ONE_SYSTEM.md). <KitProvider system="b"> wraps
// the tree inside EmptyStatesB.tsx.

import { EmptyStatesB } from "./EmptyStatesB";

export default async function EmptyStatesBPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <EmptyStatesB locale={locale} />;
}
