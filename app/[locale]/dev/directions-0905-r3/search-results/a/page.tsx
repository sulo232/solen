// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// all dated 2026-09-06, none of them this build (candidate A of the search-results comparison for
// this round); full detail is in `_design-system/REMOVED.md` and this candidate's own view file
// names each removal it actually implements. `npm run exists kit` (same session) returns the
// shared round-3 re-export barrel this file's sibling imports from, not a duplicate.
//
// Depicts: the data fetch -> app/[locale]/dev/directions-0905/search-results/_va/data.ts (getSearchResults, the real basel/coiffeur loader every sibling on this surface already shares)
//
// This file is a thin async server component, the same split every screen on this surface already
// needs: the client view composes a client-only pill primitive with an inline event handler prop,
// and a Server Component cannot pass a plain closure across that boundary. `data`/`locale` stay
// plain serializable props.

import { getSearchResults } from "@/app/[locale]/dev/directions-0905/search-results/_va/data";
import { SearchResultsA } from "./SearchResultsA";

export default async function SearchResultsCandidateAPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const data = await getSearchResults(locale);
  return <SearchResultsA data={data} locale={locale} />;
}
