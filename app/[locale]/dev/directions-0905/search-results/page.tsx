// Grounded-in: app/[locale]/dev/directions-0905/_shared/DirectionFrame.tsx (the shared
// direction-comparison shell) and app/[locale]/[city]/[category]/page.tsx (the real
// SearchTemplate route this whole comparison surface is mocking three directions of).
//
// exists-check: `npm run exists directions-0905` -> DirectionFrame only (reused as-is).
// `npm run exists search-results` -> 2 REMOVED hits, neither this page (the legacy
// SearchResults.tsx component, and the killed result-count-heading/standalone-Filters-
// button shape, both handled inside each direction's own file, not here).
//
// Depicts: the ?v= direction switch shell -> app/[locale]/dev/directions-0905/_shared/DirectionFrame.tsx (real, shared, unmodified)
// Depicts: direction A content -> ./_va/ViewA.tsx (that builder's own file, see its own header for its Depicts manifest)
// Depicts: direction B content -> ./_vb/DirectionB.tsx (this builder's own file, see its own header for its Depicts manifest)
// Depicts: direction C content -> ./_vc/GridDirection.tsx (that builder's own file, see its own header for its Depicts manifest)
//
// This file is the shared `?v=` switch for the three search-results directions. Per the
// brief: "if page.tsx does not exist yet, create it with the switch on ?v= and only your
// branch filled, the other builders add theirs." All three of _va/_vb/_vc now exist on
// disk (each builder's own folder, each untouched by this edit), so this switch wires all
// three in rather than leaving any as a placeholder; a prior version of this shared file
// briefly clobbered a sibling's branch via a concurrent overwrite (last-write-wins on one
// shared file), fixed here by merging all three back in without editing any _va/_vb/_vc
// content.
import { DirectionFrame } from "@/app/[locale]/dev/directions-0905/_shared/DirectionFrame";
import { ViewA } from "./_va/ViewA";
import { getSearchResults } from "./_va/data";
import { DirectionB } from "./_vb/DirectionB";
import { GridDirection } from "./_vc/GridDirection";
import { getSearchResultsGrid } from "./_vc/getResults";

const DIRECTIONS = [
  { value: "a", label: "Fresha list" },
  { value: "b", label: "Airbnb cards" },
  { value: "c", label: "Two-column grid" },
];

export default async function SearchResultsDirectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  const { v } = await searchParams;
  const active = v === "b" || v === "c" ? v : "a";

  return (
    <DirectionFrame surface="search-results" directions={DIRECTIONS} active={active}>
      {active === "a" ? (
        <ViewA data={await getSearchResults(locale)} locale={locale} />
      ) : active === "b" ? (
        <DirectionB locale={locale} />
      ) : (
        <GridDirectionLoaded locale={locale} />
      )}
    </DirectionFrame>
  );
}

async function GridDirectionLoaded({ locale }: { locale: string }) {
  const salons = await getSearchResultsGrid(locale);
  return <GridDirection salons={salons} locale={locale} />;
}
