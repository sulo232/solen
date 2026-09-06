// Grounded-in: app/[locale]/dev/directions-0905/home/page.tsx (the round-1 switcher shell this
// file's own shape is modelled on: a thin server component that reads a query param and renders
// the matching direction's own folder), and app/[locale]/dev/directions-0905-r2/bookings-list/page.tsx
// (the round-2 no-scaffolding shape: no DirectionFrame switcher UI, since the orchestrator brief
// for round 2 bans a visible direction switcher in the fold, "the index page is the switcher").
//
// Exists-check: `npm run exists directions-0905-r2 home` -> 0 matches; no round-2 home switch
// existed before this file. `npm run exists home` -> the real homepage
// (app/[locale]/page.tsx) and its ~40 section components, all real, reused by the "b" branch
// below (see that branch's own header for its exact composition).
//
// Depicts: direction a content -> ./_va/HomeR2DirectionA.tsx (this file only routes to it; see that file's own header for its full composition)
// Depicts: direction b content -> ./_vb/HomeFeedB.tsx (this file only routes to it and fetches its data via ./_vb/getHomeFeedBData.ts; see that file's own header for its full composition)
// Depicts: unbuilt-direction fallback message -> NET-NEW: plain text, no UI drawn, matches app/[locale]/dev/directions-0905-r2/bookings-list/page.tsx's own "Unknown system" fallback shape
//
// ADDED (direction a, same turn as its own _va/ folder): direction "a" is filled in below the
// same way "b" is, a minimal one-branch edit per this file's own established convention, no
// change to "b"'s branch or to the fallback shape.
//
// This is the SHARED switch for round 2's three home STRUCTURE directions (?v=a|b|c, an axis of
// structure, not the lift/rule/tray look-system axis the other round-2 surfaces compare). All
// three branches are now filled in, each by its own builder with a minimal one-line edit to this
// same switch, per the established round-2 convention (see bookings-list/page.tsx's own header
// for the identical shape). ADDED (direction c, this turn): routes to ./_vc/HomeDirectionC.tsx,
// the city-anchor + near-you-now + category-rails direction; no change to "a" or "b"'s branch.
//
// No chrome of its own: HideInBooking.tsx strips the real Header/BottomNav/consent bar on every
// /dev path, and the round-2 no-scaffolding rule bans a visible direction switcher in the fold,
// so this file draws nothing beyond the active direction's own content.

import HomeR2DirectionA from "./_va/HomeR2DirectionA";
import { HomeFeedB } from "./_vb/HomeFeedB";
import { getHomeFeedBData } from "./_vb/getHomeFeedBData";
import HomeDirectionC from "./_vc/HomeDirectionC";

type DirectionKey = "a" | "b" | "c";

function isDirectionKey(v: string | undefined): v is DirectionKey {
  return v === "a" || v === "b" || v === "c";
}

export default async function HomeDirectionsR2Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  const { v } = await searchParams;
  const direction = isDirectionKey(v) ? v : null;

  if (direction === "a") {
    return <HomeR2DirectionA locale={locale} />;
  }

  if (direction === "b") {
    const sections = await getHomeFeedBData(locale);
    return <HomeFeedB locale={locale} sections={sections} />;
  }

  if (direction === "c") {
    return <HomeDirectionC locale={locale} />;
  }

  return (
    <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
      {direction ? `Direction "${direction}" not built yet.` : "Unknown direction."} Try
      ?v=a, ?v=b or ?v=c.
    </div>
  );
}
