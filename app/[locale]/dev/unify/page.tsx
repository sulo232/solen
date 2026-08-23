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
import { createAdminSupabaseClient } from "@/lib/supabase";
import { SALON_PUBLIC_COLS } from "@/lib/salons/public-columns";
import { UnifyClient } from "./UnifyClient";

export default async function UnifyPage() {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") notFound();

  const admin = createAdminSupabaseClient();
  // The SAME column list the real search API selects, imported rather than retyped
  // (lib/salons/public-columns.ts). My first attempt invented column names from memory, `city` and
  // `cover_url` and `price_from`, and the build refused them: the real ones are `city_id`,
  // `cover_photo_url`, `quartier`. Reusing the constant means this page cannot drift from the API.
  const { data, error } = await admin
    .from("salons")
    .select(SALON_PUBLIC_COLS)
    .eq("is_active", true)
    .eq("listed_on_marketplace", true)
    .eq("is_test", false)
    .not("cover_photo_url", "is", null)
    .order("review_count", { ascending: false })
    .limit(6);

  if (error) console.error("[dev/unify] salon fetch failed:", error);

  return <UnifyClient salons={(data ?? []) as unknown as Record<string, unknown>[]} />;
}
