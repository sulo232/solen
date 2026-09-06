// exists-check: `npm run exists search-results` (run before this file was created) returns the
// round-1 comparison route at directions-0905/search-results (a `?v=a|b|c` switch across three
// structural directions) plus two graveyard entries: an old, fully dead component from V2 (zero
// live imports, confirmed 2026-07-13, superseded by SearchTemplate) and the killed pairing of a
// standalone result-count line with a standalone Sort button (owner, 2026-07-31: replaced by the
// filter-chip row, Sort included as one chip). Neither is drawn here. No round-2 route for this
// surface exists yet. This file is round 2's shared `?s=` switch for that surface, one look
// system per branch, per the brief: "if page.tsx does not exist yet, create it as a thin switch
// on the ?s= query ... falls back to a one-line 'unknown system' message." Only the "rule"
// branch is filled; lift/tray fall through until their own builders add their folders.
//
// Depicts: the ?s= look-system switch -> app/[locale]/dev/directions-0905-r2/kit-preview/page.tsx
// (the same ?s=lift|rule|tray convention, reused here for a screen instead of a component
// preview).
//
// This file draws no chrome and no switcher UI: HideInBooking.tsx strips the header/bottom-nav
// on every /dev route already (verified live, `_components/layout/HideInBooking.tsx`:
// `if (/\/dev(\/|$)/.test(pathname)) return null`), and the no-scaffolding rule bans a visible
// direction/system switcher in the fold. The `?s=` value is read server-side into one branch.
import { getSearchResults } from "@/app/[locale]/dev/directions-0905/search-results/_va/data";
import { ViewRule } from "./_rule/ViewRule";
import { SearchResultsTray } from "./_tray/SearchResultsTray";
import { LiftSearchResults } from "./_lift/LiftSearchResults";

export default async function SearchResultsR2Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { locale } = await params;
  const { s } = await searchParams;
  const data = await getSearchResults(locale);

  if (s === "lift") {
    return <LiftSearchResults data={data} locale={locale} />;
  }

  if (s === "rule") {
    return <ViewRule data={data} locale={locale} />;
  }

  if (s === "tray") {
    return <SearchResultsTray data={data} locale={locale} />;
  }

  return (
    <div className="p-6 font-body text-[14px] text-s-ink-2">
      Unknown system &quot;{s ?? "(none)"}&quot;. Pass ?s=lift, ?s=rule or ?s=tray.
    </div>
  );
}
