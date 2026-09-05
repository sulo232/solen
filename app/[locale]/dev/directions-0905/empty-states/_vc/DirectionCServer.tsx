// Grounded-in: components-legacy/booking/BookingsList.tsx, app/[locale]/profile/favorites/page.tsx,
// app/[locale]/profile/referral/page.tsx, app/[locale]/profile/looks/page.tsx (same four real
// surfaces DirectionC.tsx traces in full; this file is only the server-data wrapper for that
// client component, so page.tsx keeps one import line for this direction).
//
// Depicts: the whole surface -> DirectionC.tsx (this folder), which carries the full
//   per-state manifest (booking rows, salon rail, referral card, looks grid), each traced
//   to its own real file there. This wrapper draws nothing itself.
//
// Exists-check: `npm run exists directions-0905` -> this route/page already listed (see
// DirectionC.tsx's own header for the full check). Net-new: this wrapper.
import { getDirectionCData } from "./loadDirectionC";
import DirectionC from "./DirectionC";

export default async function DirectionCServer({ locale }: { locale: string }) {
  const data = await getDirectionCData(locale);
  return <DirectionC data={data} />;
}
