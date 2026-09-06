// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits:
// the TRAY grey band, the old home A/B/C structures, the three empty-state directions, the
// search-screen heading line "Hair salons in Basel sorted by most reviewed", the review count in
// parentheses beside a rating on any card, plus two more round-2 chrome experiments unrelated to
// this screen (a preview harness for the shared kit, and a service-row action-button test). None
// of them is this route: two of the seven (the heading line, the review count) name exactly the
// two things this screen must NOT render, so the hit confirms the fix instead of blocking it.
// `npm run exists search-results` (same session) surfaces round-1's own `?v=` comparison route
// and its real loader, plus a dead legacy component (V2-D51, unrelated, zero live imports) -- no
// existing `search-results/b` route existed before this file.
//
// Grounded-in: the sibling LIFT view one round earlier in this same dev tree, under
// directions-0905's follow-up folder (search-results/_lift/LiftSearchResults.tsx), read in full
// and rebuilt here by hand for this round's own candidate B value sheet, never copied; and
// _design-system/references/fresha--search-results.md ("Measured" item 2, the result-count/
// Filters row on its own line, and item 4, one card per venue: photo -> name+rating ->
// address+category -> up to three service rows inside that same card).
//
// Depicts: the search entry pill -> app/[locale]/_components/search/SearchTemplate.tsx (~line 1306-1360), reproduced statically, unchanged from the sibling view.
// Depicts: the filter-chip row (Filters icon + Sort) -> app/[locale]/_components/search/SearchTemplate.tsx (~line 1447-1543), hidden on live mobile (hidden md:block), reproduced statically.
// Depicts: the result card -> app/[locale]/_components/search/SalonResultCard.tsx ("feed" variant, composed unmodified, FLOORS LAW 9).
// Depicts: the floating Map toggle -> app/[locale]/_components/search/SearchTemplate.tsx (~line 2196), ink-fill reproduced.
//
// system: b (candidate B, LIFT refined, `_plans/R3_ONE_SYSTEM.md`).

import { getSearchResults } from "@/app/[locale]/dev/directions-0905/search-results/_va/data";
import { SearchResultsB } from "./SearchResultsB";

export default async function SearchResultsBPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const data = await getSearchResults(locale);
  return <SearchResultsB data={data} locale={locale} />;
}
