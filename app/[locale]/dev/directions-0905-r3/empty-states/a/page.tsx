// Round 3, Candidate A (RULE refined), this screen: the three empty destinations (bookings,
// saved, search results). Thin server component: read the locale, hand it to the client view.
// No chrome of its own: the shared /dev tree strips the real Header/BottomNav/consent bar on
// every /dev path (HideInBooking.tsx's own `/\/dev(\/|$)/` check), matching every other round-3
// mockup route (bookings-list/a/page.tsx, payment-step/a/page.tsx read this session both do the
// same, no header/nav of their own).
//
// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 32 matches: 7
// graveyard entries (owner-rejected round-2 work: a grey-band whole-page look, the three home
// structures, this exact screen's prior round under system keys lift/rule/tray, a search heading
// line, a review count, an isolated-component preview block, and a service-row button harness ,
// none of them this build, which is a NEW round-3 attempt at the one screen the owner named,
// ordered by the round-3 brief itself) and 10 live round-3 routes plus 13 components, none of
// them a route for this screen under any candidate letter.
//
// Grounded-in: components-legacy/ui/EmptyState.tsx (the locked icon+headline+subline+CTA
//   anatomy this screen's client view refines); app/[locale]/_components/search/
//   SearchTemplate.tsx (the real C1State no-results component the third state's icon/copy match).
//
// Depicts: the whole screen's anatomy -> ./EmptyStatesA.tsx (its own header names every real
//   copy key and real component this file's render traces to; this file draws nothing itself).

import EmptyStatesA from "./EmptyStatesA";

export default async function EmptyStatesR3CandidateAPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <EmptyStatesA locale={locale} />;
}
