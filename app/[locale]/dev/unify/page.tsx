// Mockup-scope: whole-page
// Exists-check: `npm run exists unify` returned 0 matches. Nothing is duplicated: this page renders
// the REAL search-results card, `app/[locale]/_components/search/SalonResultCard.tsx` in its
// owner-approved `feed` variant, with real salons from the database. It is a copy of the real
// surface with only the treatment changed, never a redraw.
//
// measure-ok: every number this page argues from was read with getComputedStyle off the live built
// site at 390x844 on 2026-08-23, recorded in _plans/DESIGN_UNIFY_2026-08-23.md. Short version:
// the store page he likes has 6 text sizes, its biggest is 30px and 2.31x its smallest, 13% of its
// text is bold. The search results screen has 5 sizes, its biggest is 18px and only 1.5x its
// smallest, and 3% of its text is bold. That gap is what "a different design system" measures out
// to on this surface.
//
// WHY THIS SCREEN. He said he likes the store page and the home page and that other screens differ.
// Of the seven measured, the search results screen is the flattest: 3% bold against the store
// page's 13%, no element above 18px, and 90 pieces of text in one viewport.
//
// English chrome; the real card renders its own locale, which the rule exempts.

import { notFound } from "next/navigation";
import { UnifyClient } from "./UnifyClient";

export default async function UnifyPage() {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") notFound();

  // No hand-picked data any more: the real page fetches its own, exactly as it does in the
  // product. That is the point of the rebuild.
  return <UnifyClient locale="de" />;
}
