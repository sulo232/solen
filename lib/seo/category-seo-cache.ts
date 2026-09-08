// =============================================================================
// category-seo-cache , the two database reads that block a category page from
// rendering, cached.
//
// exists-check: `npm run exists "category seo cache"` = 0 matches. This does NOT invent a caching
// approach: it copies the in-memory TTL pattern this codebase already uses twice, in
// `lib/cities.ts` (`activeCitiesCache`, 5 min) and `lib/search/filter-availability.ts`
// (`FILTER_AVAILABILITY_TTL_MS`, 5 min), which itself records that `unstable_cache` appears nowhere
// in this repo. Same shape, same TTL, same bust-function convention.
//
// WHY IT EXISTS, measured against the live database on 2026-08-14 rather than assumed. Tapping a
// category pill on the home page is a full page navigation, and before that page can return any
// HTML it awaits two Supabase round trips whose output NO USER EVER SEES:
//
//     coiffeur     count for the meta description 376ms + salon list for the JSON-LD 209ms = 585ms
//     barbershop   264ms + 317ms = 581ms
//     nails        301ms + 279ms = 580ms
//
// One feeds a number into the page description, the other feeds a hidden search-engine block. Both
// are the same answer for every visitor and both change about as often as a salon is added, so
// paying half a second of the customer's time for them on every single tap is the defect.
//
// The count uses `select("id", { count: "exact", head: true })` rather than `select("*")`: head
// returns no rows either way, and naming a column keeps it clear of the select-star rule that
// exists because this table carries `stripe_account_id` and `owner_id`.
//
// WHAT THIS DOES NOT FIX, stated so nobody reads more into it: the navigation itself. Switching
// category still loads a page. Airbnb swaps its grid in place. That is a bigger change and it is
// proposed separately; this one removes the part that is pure waste.
// =============================================================================

import { createAdminSupabaseClient } from "@/lib/supabase";

export type CategorySeo = {
  /** Active, listed salons in this category. Feeds the meta description only. */
  count: number;
  /** Top salons by rating, for the JSON-LD ItemList. Never rendered visibly. */
  salons: { name: string; slug: string; cover_photo_url: string | null; average_rating: number | null; review_count: number | null }[];
};

const cache = new Map<string, { data: CategorySeo; fetchedAt: number }>();
const TTL_MS = 5 * 60 * 1000; // 300s, the same TTL as lib/cities.ts and filter-availability.ts

/** Force the next `getCategorySeo(category)` to re-hit the DB. Call after a salon's categories or
 *  `is_active` change, so the count corrects without waiting out the TTL. Omit the argument to
 *  clear every category at once. */
export function bustCategorySeoCache(category?: string): void {
  if (category) cache.delete(category);
  else cache.clear();
}

/**
 * SERVER-ONLY. Both SEO reads for one category, cached together for 5 minutes and fetched in
 * PARALLEL rather than one after the other, which is how the pages do it today.
 *
 * On a database error it returns the last good cached value if there is one, and an empty result
 * otherwise, which is the convention `lib/cities.ts` and `filter-availability.ts` already follow: a
 * transient error should degrade the SEO block, never break the page.
 */
export async function getCategorySeo(category: string): Promise<CategorySeo> {
  const hit = cache.get(category);
  if (hit && Date.now() - hit.fetchedAt < TTL_MS) return hit.data;

  try {
    const supabase = createAdminSupabaseClient();
    // Same visibility rule as app/sitemap.ts:54-56, so the ItemList JSON-LD below never lists a
    // test or unlisted salon that the sitemap and salon page already hide from Google.
    const [countRes, salonsRes] = await Promise.all([
      supabase
        .from("salons")
        .select("id", { count: "exact", head: true })
        .contains("categories", [category])
        .eq("is_active", true)
        .or("listed_on_marketplace.is.null,listed_on_marketplace.eq.true")
        .or("is_test.is.null,is_test.eq.false"),
      supabase
        .from("salons")
        .select("name, slug, cover_photo_url, average_rating, review_count")
        .contains("categories", [category])
        .eq("is_active", true)
        .or("listed_on_marketplace.is.null,listed_on_marketplace.eq.true")
        .or("is_test.is.null,is_test.eq.false")
        .order("average_rating", { ascending: false })
        .limit(20),
    ]);

    const data: CategorySeo = {
      count: countRes.count ?? 0,
      salons: salonsRes.data ?? [],
    };
    cache.set(category, { data, fetchedAt: Date.now() });
    return data;
  } catch (err) {
    console.error("[category-seo-cache] lookup failed:", err);
    return hit?.data ?? { count: 0, salons: [] };
  }
}
