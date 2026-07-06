// =============================================================================
// lib/search/filter-availability.ts
// =============================================================================
//
// V3-D454 (2026-07-06, owner-approved public/_mockups/sweep-datastate-filters.html):
// the Angebote (deals) and Fuer-wen (gender) filter surfaces are HIDDEN while live
// data cannot discriminate on them, and reappear automatically once it can. Both
// filter CODES already work (verified live 2026-07-06 against app/api/salons/route.ts
// `deals=true` / `gender=` params); the problem is the data: 0 salons currently carry
// a last-minute discount, and every active service is tagged for both genders, so
// selecting either filter today always returns the SAME result set (deals stays 0
// rows; gender never narrows). Surfacing a control that provably can't discriminate
// is a silent no-op (see project CLAUDE.md "silent no-ops" section), same class as a
// fabricated value (LOCKFILE no-fabrication rule), so the fix is to hide it, not keep
// rendering a control that lies about being useful.
//
// `npm run exists filter-availability` gave 0 hits (net new). `npm run exists
// availability` gave 18 hits, all unrelated (staff/booking/chair/walk-in availability,
// the DELETED staff Verfuegbarkeit tab, availability_slots table). None is this
// server-side filter-visibility helper, so this is a new file, not a duplicate.
//
// Caching: this file follows the SAME server-only in-memory TTL-cache pattern as
// `lib/cities.ts` (`getActiveCities` / `activeCitiesCache`), not `unstable_cache`.
// There is no existing `unstable_cache` usage anywhere in this codebase to extend,
// while the cities module is the closest sibling (a rarely-changing, admin-adjacent,
// server-only lookup gating what search chrome renders). TTL = 300s (5 min), same
// order of magnitude as the cities cache (5 min) and the geocode route's
// `servedCitiesCache` it itself cites.
// =============================================================================

export interface FilterAvailability {
  /** true when >=1 listed, non-test, active salon has a real last-minute deal. */
  deals: boolean;
  /** true when >=1 active service is tagged for ONLY one gender (i.e. the
   *  "Fuer wen" filter can actually narrow the result set). */
  gender: boolean;
}

let cache: { data: FilterAvailability; fetchedAt: number } | null = null;
const FILTER_AVAILABILITY_TTL_MS = 5 * 60 * 1000; // 300s, matches lib/cities.ts

/** Force the next `getFilterAvailability()` call to re-hit the DB. Call this
 *  after a salon's last-minute settings change or a service's suitable_gender
 *  is edited, so the filter reappears without waiting out the TTL. */
export function bustFilterAvailabilityCache(): void {
  cache = null;
}

/**
 * SERVER-ONLY. Resolves whether the Angebote and Fuer-wen filters currently have
 * data to discriminate on. Both checks are cheap head-counts (limit-1 semantics via
 * `{ count: "exact", head: true }`, same idiom as app/api/search/no-results/route.ts),
 * never a full row pull. Falls back to the last good cached value (not `true`) on a
 * DB error, matching lib/cities.ts's error-handling convention: a transient DB error
 * should not flicker filters on/off, it should keep showing what was last proven.
 */
export async function getFilterAvailability(): Promise<FilterAvailability> {
  if (cache && Date.now() - cache.fetchedAt < FILTER_AVAILABILITY_TTL_MS) {
    return cache.data;
  }
  const { createServerSupabaseClient } = await import("@/lib/supabase");
  const supabase = await createServerSupabaseClient();

  // Deals: same predicate /api/salons uses for `deals=true` (route.ts ~L180),
  // scoped to salons that are actually visible on the marketplace (is_active,
  // listed_on_marketplace, not a test salon). A deal on a hidden/test salon
  // could never appear in real search results, so it must not count here either.
  const dealsTask = supabase
    .from("salons")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("listed_on_marketplace", true)
    .eq("is_test", false)
    .gt("last_minute_discount_percent", 0);

  // Gender: the filter can only narrow results if at least one active service is
  // tagged for ONE gender, not both (suitable_gender is a text[] like
  // {male,female}). `.contains("suitable_gender", [g])` (the same predicate
  // app/api/salons/route.ts uses for `?gender=`) matches ANY service tagged for
  // that gender, including ones tagged for both, so a plain "any male-tagged
  // service exists" count would stay > 0 even when every service is tagged for
  // both genders (today's actual data): a silent false-positive. Proving the
  // filter DISCRIMINATES needs services whose suitable_gender is exactly a
  // single-gender array (not a superset containing both), so this counts rows
  // where suitable_gender contains male but does NOT also contain female
  // (male-only), and the mirror image (female-only, second head-count). Either
  // count > 0 means picking "Damen" or "Herren" would exclude at least one
  // currently-active service: an actual discrimination.
  const maleOnlyTask = supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .contains("suitable_gender", ["male"])
    .not("suitable_gender", "cs", '{"female"}');

  const femaleOnlyTask = supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .contains("suitable_gender", ["female"])
    .not("suitable_gender", "cs", '{"male"}');

  const [dealsResult, maleOnlyResult, femaleOnlyResult] = await Promise.all([
    dealsTask,
    maleOnlyTask,
    femaleOnlyTask,
  ]);

  if (dealsResult.error) {
    console.error("[filter-availability] deals count failed:", dealsResult.error.message);
  }
  if (maleOnlyResult.error) {
    console.error("[filter-availability] male-only count failed:", maleOnlyResult.error.message);
  }
  if (femaleOnlyResult.error) {
    console.error("[filter-availability] female-only count failed:", femaleOnlyResult.error.message);
  }

  // Any query error: fall back to the last good cached value (never a bare
  // `true`, which would silently re-show a filter that hasn't actually proven
  // it can discriminate).
  if (dealsResult.error || maleOnlyResult.error || femaleOnlyResult.error) {
    if (cache) return cache.data;
  }

  const data: FilterAvailability = {
    deals: (dealsResult.count ?? 0) > 0,
    gender: (maleOnlyResult.count ?? 0) > 0 || (femaleOnlyResult.count ?? 0) > 0,
  };
  cache = { data, fetchedAt: Date.now() };
  return data;
}
