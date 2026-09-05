// V3-D344 (2026-05-28): V3 is the salon PDP. Analytics (track-view POST + posthog
// + trackSalonView recently-viewed) + JSON-LD structured data are wired directly
// into SalonDetailV3, full parity with the retired legacy stack. The `?v3=0`
// legacy escape hatch and its render path were removed once V3 was verified
// (booking flow handoff confirmed).
// History: V3-D202 Phase B introduced the opt-in `?v3=1` gate; V3-D344 promoted
// V3 to default; the legacy tree was retired in full afterwards.
//
// B4 load audit (2026-07-04): converted to a SERVER component. The public salon
// data (the same shape GET /api/salons/[slug] returns) is now fetched here via
// the shared loadSalonDetail() loader and passed to SalonDetailV3 as a prop,
// instead of SalonDetailV3 fetching it client-side in a useEffect after
// hydration. SalonDetailV3 stays "use client" (it still owns interactive state:
// lightbox, gallery, walk-in toggle, favorite heart, etc.) but no longer fetches
// the main salon record itself. Pure data-fetch relocation, no visual change.
//
// Hydration fix (2026-07-04): open/closed status + "today" key are now
// computed ONCE here (loadSalonDetailWithStatus, in the salon's own timezone)
// and passed down as plain serializable props, instead of each section
// component calling computeOpenStatus()/new Date() again during client
// render. See lib/salon-detail.ts for the full rationale.
import { notFound } from "next/navigation";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { SalonDetailV3 } from "@/app/[locale]/_components/salon/SalonDetailV3";

export default async function SalonProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug, locale } = await params;
  const result = await loadSalonDetailWithStatus(slug, locale);

  if (!result) notFound();

  const { salon, openStatus, todayKey } = result;

  return <SalonDetailV3 salon={salon} openStatus={openStatus} todayKey={todayKey} />;
}
