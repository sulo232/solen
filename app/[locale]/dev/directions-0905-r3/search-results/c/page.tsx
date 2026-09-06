// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED
// hits, all unrelated round-2 direction-comparison surfaces (a grey-band look system, three
// home-feed structure options, a set of empty-state directions, a component-preview
// switcher for the three round-2 look systems, and a service-row button-matching harness),
// none of them a search-results-c file. No route at this exact path exists yet. See
// ViewC.tsx beside this file for the full grounding, Depicts manifest and fix-list mapping.
//
// Grounded-in: app/[locale]/dev/directions-0905/search-results/_va/data.ts (the real
// loader, imported unmodified below).
//
// Depicts: candidate-C search-results composition -> app/[locale]/_components/search/SalonResultCard.tsx
// (the result cards this route renders through ViewC.tsx beside this file, which carries its
// own complete Depicts manifest for every other surface: SearchTemplate.tsx's search pill and
// filter row, Candidate C's own Map/mode-toggle pill row).
//
// This file is the thinnest possible server wrapper: load the real data, render the one
// candidate-C view. No `?s=` switch here (unlike round 2's shared page.tsx) since this
// build's brief assigns exactly one candidate to this folder.

import { getSearchResults } from "@/app/[locale]/dev/directions-0905/search-results/_va/data";
import { ViewC } from "./ViewC";

export default async function SearchResultsCPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const data = await getSearchResults(locale);
  return <ViewC data={data} locale={locale} />;
}
