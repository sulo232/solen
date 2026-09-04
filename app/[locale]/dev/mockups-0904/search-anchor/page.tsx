// Exists-check: `npm run exists search-anchor` ran this turn (0 hits, safe to build).
// `npm run exists SearchTemplate` ran this turn: SearchTemplate.tsx is the ONLY live
// implementation of /search today; the graveyard hits it returned for two older, already-dead
// search surfaces are unrelated to this mockup (a results-header display anchor) and neither is
// re-proposed here. The one new thing is the anchor itself: no first-viewport heading exists on
// SearchTemplate today (measured this morning, no text >= 28px in the first viewport).
//
// Depicts: sticky search bar, filter chips, results grid -> app/[locale]/_components/search/SearchTemplate.tsx
//   (real, unmodified import, identical props to app/[locale]/search/page.tsx)
// Depicts: search-context display anchor -> NET-NEW, see ./SearchAnchor.tsx (fed into
//   SearchTemplate's own real `aboveSlot` prop, not a byte-copy or DOM edit)
//
// Mockup-scope: whole-page (the brief: "the decision is a first-viewport one")
//
// Grounded-in: app/[locale]/search/page.tsx (the real route this mirrors, same props/Suspense
// shape), app/[locale]/_components/search/SearchTemplate.tsx.
//
// Airbnb citation (punch-list item 2, fixed): no file matching `airbnb--search*.md` exists in
// _design-system/references/ , checked again this round, still zero hits, so the brief's named
// path was never real and the earlier round should have said that instead of building around it.
// airbnb--home-search-chrome.md (the closest-named file) captures Airbnb's HOME page chrome, not
// the search-results screen, so it does not answer where a results-page anchor goes either.
// The file that DOES answer it is chrome-by-page-type.md, a live capture at 390x844 (2026-08-09,
// same references/ folder) with a page-by-page table of Airbnb's own top-of-screen content; its
// "search results" row (line 22) reads verbatim: "back arrow, a small summary of the search, a
// filter icon. Tabs gone." That "small summary of the search" sitting at the top of the results
// screen, once the tabs/hero of the home page are gone, IS the placement this mockup copies: one
// line naming the active search context, above the grid, below the sticky bar. Cited by row, per
// the brief's instruction, from the closest real Airbnb capture that covers a search-RESULTS
// screen (home-search-chrome.md does not).
//
// Inherited from the real component: (punch-list item 1) the mobile-rendered SalonResultCard
// (app/[locale]/_components/search/SalonResultCard.tsx L555-607, the block actually shown at
// 402px, NOT the desktop-only L431 variant which is `hidden md:grid` and never paints here)
// already carries 4 distinct sizes on its own: 16px name (L555/594), 14px price (L559/602),
// 13px address lines (L564-565/597-598), 13.5px view-more/price-tier label (L584/607). That is
// the REAL /search first viewport (the Current block below) already sitting at the LOCKFILE
// <=4-size ceiling with zero headroom, before this mockup's anchor is added, which is a defect in
// the real component's own type budget, not in this mockup. This file does not touch
// SalonResultCard.tsx (named FIXED in the brief, out of this folder's scope) to "fix" it. Adding
// the 28px anchor required by FLOORS LAW 6 pushes the Proposed block to 5 distinct sizes
// {13, 13.5, 14, 16, 28}, one over the LOCKFILE <=4-size ceiling. That is a genuine, unresolved
// conflict between two co-equal rules (FLOORS LAW 6 vs the type-budget ceiling) that this file
// cannot close on its own; see the returned `blocked:` note for the two resolutions it needs a
// decision on (merge the card's 13/13.5 pair in a separate approved change, or name a 5-size
// exception for this screen).
//
// The zero-header/zero-nav render on this route is HideInBooking.tsx
// (app/[locale]/_components/layout/HideInBooking.tsx:60, `if (/\/dev(\/|$)/.test(pathname))
// return null;`), an owner-dated (2026-08-16) rule stripping app chrome on every /dev route
// sitewide. Header.tsx's own self-hide logic is unrelated and was cited in error previously.

import { Suspense } from "react";
import SearchTemplate from "@/app/[locale]/_components/search/SearchTemplate";
import { getFilterAvailability } from "@/lib/search/filter-availability";
import { SearchAnchor } from "./SearchAnchor";

export default async function SearchAnchorMockupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const filterAvailability = await getFilterAvailability();

  // Same breadcrumb shape /search/page.tsx passes, English label ("Search" not "Suche"): the
  // real file hardcodes the German literal regardless of locale, which is a pre-existing
  // production detail out of this mockup's scope to fix; mockup copy stays English per rule.
  const breadcrumb = [{ label: "Solen", href: `/${locale}` }, { label: "Search" }];

  return (
    <main className="min-h-[100dvh] bg-white">
      <div className="border-t border-s-border bg-s-bg-sunken px-4 py-2">
        <p className="text-[13px] font-semibold text-s-ink">Current</p>
      </div>
      <Suspense>
        <SearchTemplate
          locale={locale}
          serviceFilter={null}
          filterAvailability={filterAvailability}
          breadcrumb={breadcrumb}
        />
      </Suspense>

      <div className="border-t border-s-border bg-s-bg-sunken px-4 py-2">
        <p className="text-[13px] font-semibold text-s-ink">Proposed</p>
      </div>
      <Suspense>
        <SearchTemplate
          locale={locale}
          serviceFilter={null}
          filterAvailability={filterAvailability}
          breadcrumb={breadcrumb}
          aboveSlot={<SearchAnchor locale={locale} />}
        />
      </Suspense>
    </main>
  );
}
