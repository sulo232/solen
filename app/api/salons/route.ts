export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { SALON_CATEGORY_SLUGS } from "@/lib/validations";
import { generalLimiter, authLimiter, applyRateLimit, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, createSalonSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { onboardingWelcome } from "@/lib/email-templates/salon-onboarding";
import { autoTranslateDescription } from "@/lib/ai/translate";
import { CURRENT_TOS_VERSION } from "@/lib/tos-version";
import { isOpenNow, type OpeningHours } from "@/lib/salon-hours";
import { generateEmbedding } from "@/lib/search/embeddings";
import { SALON_PUBLIC_COLS } from "@/lib/salons/public-columns";
import { ANON_CACHE_HEADERS } from "@/lib/salons/cache-headers";
import type { Database, Json } from "@/lib/database.types";
import { minPriceService, MIN_PRICE_SERVICE_COLUMNS, type PricedServiceRow } from "@/lib/min-price-service";

// ANON_CACHE_HEADERS moved to lib/salons/cache-headers.ts (2026-07-16): Next's
// route-module type contract only allows HTTP method exports + a fixed config-export
// allowlist from a route.ts, so re-exporting this constant here broke the generated
// .next/types/app/api/salons/route.ts constraint check (TS2344). Same fix pattern as
// lib/discovery/feed-cache-headers.ts. Full rationale + Netlify precedence notes now
// live at the new module.

// Time-of-day windows (local hour ranges) for the `period` availability filter.
const PERIOD_HOURS: Record<string, [number, number]> = {
  morning: [9, 12],
  noon: [12, 15],
  afternoon: [15, 18],
  evening: [18, 24],
};

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    // Normalize: a ?service=<category-slug> (from the search overlay) is a CATEGORY filter,
    // not a service-name text match , fixes the ?service=/?category= ambiguity (IA council).
    const rawService = searchParams.get("service");
    const serviceIsCategory = !!rawService && SALON_CATEGORY_SLUGS.includes(rawService.toLowerCase());
    const category = searchParams.get("category") ?? (serviceIsCategory ? rawService!.toLowerCase() : null);
    const city = searchParams.get("city");
    const min_price = searchParams.get("min_price");
    const max_price = searchParams.get("max_price");
    const min_rating = searchParams.get("min_rating");
    const accepts_payment = searchParams.get("accepts_payment");
    const instant_bookable = searchParams.get("instant_bookable");
    const deals = searchParams.get("deals");
    const walk_in = searchParams.get("walk_in");
    const open_now = searchParams.get("open_now"); // currently-open (Zurich tz) via isOpenNow over opening_hours
    const gender = searchParams.get("gender"); // V3-D387: "female" | "male" → services.suitable_gender
    const date = searchParams.get("date"); // YYYY-MM-DD for availability filtering
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const sort = searchParams.get("sort") ?? "rating";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const offset = (page - 1) * limit;
    const idsParam = searchParams.get("ids");
    const serviceFilter = serviceIsCategory ? null : rawService;
    const q = searchParams.get("q")?.trim(); // free-text — semantic rank, combined with the filters below
    const period = searchParams.get("period"); // morning|noon|afternoon|evening open-slot time-of-day filter

    // "Search this area" (map pan/zoom): a viewport box that replaces the city
    // filter. All 4 corners must be finite numbers and form a real box (north >
    // south, east > west) or the box is ignored and the city path behaves as today.
    const boundsNorth = parseFloat(searchParams.get("north") ?? "");
    const boundsSouth = parseFloat(searchParams.get("south") ?? "");
    const boundsEast = parseFloat(searchParams.get("east") ?? "");
    const boundsWest = parseFloat(searchParams.get("west") ?? "");
    const hasBounds =
      Number.isFinite(boundsNorth) &&
      Number.isFinite(boundsSouth) &&
      Number.isFinite(boundsEast) &&
      Number.isFinite(boundsWest) &&
      boundsNorth > boundsSouth &&
      boundsEast > boundsWest;

    // V3-D349: the category/search page (?with_slots=1) needs per-salon services
    // + next available slots for the Fresha-style booking card. Homepage feeds omit
    // the flag -> lighter payload (just price for avg_price).
    const withSlots = searchParams.get("with_slots") === "1";
    // The service NAMES ride along with the price on both branches. Art. 10/13 PBV: a from-price
    // is only lawful in advertising when the copy says WHICH offer it buys. Full rule:
    // _rules/LEGAL_COPY.md.
    //
    // RESTORED 2026-08-16. This landed on 2026-07-27 in 599f5f231, verified live that day, and
    // then vanished: that commit is an ancestor of main, yet main's copy of this file has none of
    // it, so a merge resolution took the other side of the file and dropped it silently. Nothing
    // in REMOVED.md or TASTE_LOG.md retires it. The UI half survived the merge, so seven render
    // sites kept reading a field the API no longer returned and quietly printed a bare price.
    //
    // CORRECTION, same day: the line that used to sit here read "NB: services has only name_de +
    // name_en in the live DB (no name_fr/name_it)". That is false, and it is why both the original
    // work and its restoration covered two locales instead of four. Measured against the live
    // database: 264 of 264 service rows carry all four names, e.g. Damen-Haarschnitt / Women Cut /
    // Coupe Dame / Taglio capelli donna. A French customer was being shown a German service name
    // beside their price on the strength of a comment nobody re-checked.
    const servicesCols = withSlots
      ? `id, duration_minutes, category, ${MIN_PRICE_SERVICE_COLUMNS}`
      : MIN_PRICE_SERVICE_COLUMNS;
    // R4-3 (2026-07-03): when ?with_slots=1 (category/search page), also embed active
    // staff specialties so SearchTemplate can build the on-photo specialization chip
    // for a free-text query. Embed is PROVEN by curl before shipping; if it errors or
    // returns nothing the chip logic falls back to services-only matching (no silent
    // no-op). staff_members(specialties) is filtered to active staff via the embedded
    // resource `is_active` predicate below (staff_members!inner is NOT used so salons
    // with no active staff still return, just with an empty staff array).
    const staffEmbed = withSlots ? ", staff_members(specialties, is_active)" : "";

    // Explicit public column allowlist, shared with app/api/search/treatments/route.ts.
    // See lib/salons/public-columns.ts for the full rationale (replaces the old
    // `select('*')` which shipped ~98 salon columns, including owner/payment internals
    // and moderation fields, to anonymous clients). The is_active / listed_on_marketplace /
    // is_test / city_id filters are applied as .eq() predicates and do not need to be
    // selected.
    const salonCols = SALON_PUBLIC_COLS;

    const supabase = await createServerSupabaseClient();

    // Free-text: resolve semantic rank FIRST, then AND it with the structured filters
    // below (city / date / period / walk-in...). semanticMode skips the DB sort+range so
    // results come back in relevance order (sorted + paginated in JS at the end).
    let rankIndex: Map<string, number> | null = null;
    if (q && q.length >= 2) {
      let emb: string | null = null;
      try {
        // Embeddings are near-free and stay under the per-minute generalLimiter above only
        // (no daily AI cap here, that's reserved for the expensive generation routes, see
        // lib/ratelimit.ts). Race the embedding call against a short timeout so a slow
        // Gemini round-trip never blocks the whole search request. On timeout, fall back
        // to null and let search_salons_ranked rank lexically (p_query_embedding accepts null).
        const EMBED_TIMEOUT_MS = 500;
        const vec = await Promise.race([
          generateEmbedding(q).catch(() => null),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), EMBED_TIMEOUT_MS)),
        ]);
        if (vec) {
          emb = JSON.stringify(vec);
        } else {
          console.warn("[api/salons GET] embedding slow (>500ms), lexical-only for:", q);
        }
      } catch (e) {
        console.error("[api/salons GET] query embedding failed, lexical-only:", (e as Error).message);
      }
      const { data: ranked, error: rErr } = await supabase.rpc("search_salons_ranked", {
        p_q: q,
        p_limit: 60,
        p_query_embedding: emb ?? undefined,
      });
      if (rErr) console.error("[api/salons GET] search_salons_ranked failed:", rErr.message);
      const ids = (ranked ?? []).map((r: { salon_id: string }) => r.salon_id as string);
      if (ids.length === 0) return NextResponse.json({ items: [], total: 0, page, limit }, { headers: ANON_CACHE_HEADERS });
      rankIndex = new Map(ids.map((id: string, i: number): [string, number] => [id, i]));
    }
    const semanticMode = rankIndex !== null;

    // Assembled as a plain `string` (not a literal-typed template) so the dynamic
    // staff_members embed doesn't trip the PostgREST select type-parser. The embed is
    // runtime-proven (curl 2026-07-03) and rows are already read as Record<string,unknown>
    // downstream, so the opaque select type is consistent with the existing handling.
    const selectStr: string = `${salonCols}, services(${servicesCols})${staffEmbed}`;
    let query = supabase
      .from("salons")
      .select(selectStr, { count: "exact" })
      .eq("is_active", true)
      .eq("listed_on_marketplace", true)
      .eq("is_test", false);

    if (rankIndex) query = query.in("id", [...rankIndex.keys()]);

    if (category) query = query.contains("categories", [category]);

    // "Search this area": direct predicates on salons.latitude/longitude. Bounds
    // replace the city filter entirely (see the cityTask gate below) since panning
    // may move the viewport outside the originally-searched city.
    if (hasBounds) {
      query = query
        .gte("latitude", boundsSouth)
        .lte("latitude", boundsNorth)
        .gte("longitude", boundsWest)
        .lte("longitude", boundsEast);
    }

    if (idsParam) {
      const idArray = idsParam.split(",").filter(id => id.trim() !== "");
      if (idArray.length > 0) {
        query = query.in("id", idArray);
      }
    }

    if (min_rating) query = query.gte("average_rating", parseFloat(min_rating));
    if (accepts_payment === "true") query = query.eq("accepts_online_payment", true);

    // Filter to salons with active last-minute deals
    if (deals === "true") {
      query = query.gt("last_minute_discount_percent", 0);
    }

    // Filter to salons that accept walk-ins. walkin_enabled is the real column and the
    // same gate /api/walkin/availability uses, so the search filter and the live wait-time
    // numbers agree on which salons are walk-in.
    if (walk_in === "true") {
      query = query.eq("walkin_enabled", true);
    }

    // V3-D387: amenity boolean filters. Each query param maps 1:1 to a salons
    // boolean column (seeded data). Simple .eq(col, true) when the param is "true".
    for (const col of [
      "wheelchair_accessible",
      "near_public_transport",
      "kid_friendly",
      "pet_friendly",
      "wifi_friendly",
      "lgbtq_friendly",
      "woman_owned",
      "family_owned",
      "student_discount",
    ]) {
      if (searchParams.get(col) === "true") query = query.eq(col, true);
    }

    const emptyResult = () => NextResponse.json({ items: [], total: 0, page, limit }, { headers: ANON_CACHE_HEADERS });

    // Concurrent pre-queries. Each of the filters below resolves an independent
    // salon-id set (or a city lookup) that is AND-combined into the main query via
    // .in("id", ...). They have no data dependency on one another, so they ran as
    // a chain of sequential awaits before (city, then service, instant, gender,
    // price, date), each adding a full round-trip to the latency. Fire them all at
    // once with Promise.all and apply the results afterwards. AND-combining .in()
    // filters is order-independent, so the result set + count are identical, just
    // one round-trip of latency instead of N. The id-resolving slot scans
    // (instant_bookable + date) go through salons_with_slot_in_hours over the full
    // 0..24 hour range, which returns DISTINCT salon_ids server-side (no ~17k-row
    // JS pull, no PostgREST row-cap truncation).
    const validDate = !!date && /^\d{4}-\d{2}-\d{2}$/.test(date);
    const dateNarrows = validDate && !(period && PERIOD_HOURS[period]);

    // City resolution (slug/name lookup) as one concurrent task, running in parallel
    // with the other filters.
    type CityOutcome =
      | { kind: "skip" }
      | { kind: "empty" }
      | { kind: "ok"; cityId: string };
    const cityTask: Promise<CityOutcome> = (async () => {
      // Bounds override city: a "search this area" box already scopes the query via
      // the lat/lng predicates above, so skip city resolution entirely (a stale city
      // filter would AND-narrow the box down to the old city, silently no-op'ing pans
      // outside it).
      if (!city || hasBounds) return { kind: "skip" };
      // Resolve the city by slug OR localized name, case-insensitive: the search
      // overlay sends the display name ("Zuerich") while category pages send the
      // slug. Matching both means location filtering works from either entry point.
      const { data: cityRows } = await supabase
        .from("cities")
        .select("id, slug, name_de, name_en, name_fr, name_it");
      const cKey = city.toLowerCase().trim();
      const cMatch = (cityRows ?? []).find((c: Record<string, unknown>) =>
        [c.slug, c.name_de, c.name_en, c.name_fr, c.name_it].some(
          (v) => typeof v === "string" && v.toLowerCase().trim() === cKey,
        ),
      );
      const cityId = cMatch?.id as string | undefined;
      if (!cityId) return { kind: "empty" };
      return { kind: "ok", cityId };
    })();

    // Service sub-filter: salons offering a service whose name matches.
    const serviceTask = serviceFilter
      ? supabase
          .from("services")
          .select("salon_id")
          .ilike("name_de", `%${serviceFilter}%`)
          .eq("is_active", true)
      : null;

    // V3-D387: "Fuer wen" (gender). Salons with >=1 active service for the gender
    // (suitable_gender is a text[] like {male,female}).
    const genderTask = gender
      ? supabase
          .from("services")
          .select("salon_id")
          .eq("is_active", true)
          .contains("suitable_gender", [gender])
      : null;

    // V3-D384: Price filter. Salons with >=1 active service in the [min,max] band.
    function buildPriceTask() {
      let priceQ = supabase.from("services").select("salon_id").eq("is_active", true);
      if (min_price) priceQ = priceQ.gte("price", parseFloat(min_price));
      if (max_price) priceQ = priceQ.lte("price", parseFloat(max_price));
      return priceQ;
    }
    const priceTask = (min_price || max_price) ? buildPriceTask() : null;

    // Time-of-day (period) filter. DISTINCT salon_ids whose available slot's local
    // hour is in the window, server-side via the RPC (no row-cap, no JS scan). If a
    // date is set it scopes to that day, otherwise the next 14 days.
    let periodTask: ReturnType<typeof supabase.rpc<"salons_with_slot_in_hours">> | null = null;
    if (period && PERIOD_HOURS[period]) {
      const [startH, endH] = PERIOD_HOURS[period];
      const lo = validDate ? `${date}T00:00:00` : new Date().toISOString();
      const hi = validDate
        ? `${date}T23:59:59`
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      periodTask = supabase.rpc("salons_with_slot_in_hours", {
        p_start_hour: startH,
        p_end_hour: endH,
        p_from: lo,
        p_to: hi,
      });
    }

    // instant_bookable: salons with >=1 available slot in the next 48h. Resolved as
    // DISTINCT salon_ids via the hour-window RPC over the full 0..24 range, so it no
    // longer pulls ~17k slot rows into JS just to dedupe ~21 ids (and no longer
    // silently drops salons past PostgREST's row cap).
    let instantTask: ReturnType<typeof supabase.rpc<"salons_with_slot_in_hours">> | null = null;
    if (instant_bookable === "true") {
      instantTask = supabase.rpc("salons_with_slot_in_hours", {
        p_start_hour: 0,
        p_end_hour: 24,
        p_from: new Date().toISOString(),
        p_to: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });
    }

    // date narrow-filter: salons with >=1 available slot on the chosen day. Same
    // DISTINCT-via-RPC approach (0..24 hour range is the whole day). Owner
    // 2026-06-13: picking a date should NARROW results, not just annotate the next
    // available slot (the post-query block below still computes those labels).
    let dateTask: ReturnType<typeof supabase.rpc<"salons_with_slot_in_hours">> | null = null;
    if (dateNarrows) {
      dateTask = supabase.rpc("salons_with_slot_in_hours", {
        p_start_hour: 0,
        p_end_hour: 24,
        p_from: `${date}T00:00:00`,
        p_to: `${date}T23:59:59`,
      });
    }

    // open_now: "open right now" depends on Zurich-local day/time vs the free-form
    // opening_hours jsonb, which the shared isOpenNow helper computes in JS (it
    // cannot be a PostgREST predicate). Fetch the candidate rows; filter in JS below
    // and constrain with .in() BEFORE .range() so count + pagination stay correct.
    const openNowTask = open_now === "true"
      ? supabase
          .from("salons")
          .select("id, opening_hours")
          .eq("is_active", true)
          .eq("listed_on_marketplace", true)
          .eq("is_test", false)
      : null;

    const [
      cityOutcome, serviceRes, genderRes, priceRes,
      periodRes, instantRes, dateRes, openNowRes,
    ] = await Promise.all([
      cityTask, serviceTask, genderTask, priceTask,
      periodTask, instantTask, dateTask, openNowTask,
    ]);

    // Apply city resolution in the original semantics.
    if (cityOutcome.kind === "empty") return emptyResult();
    if (cityOutcome.kind === "ok") {
      query = query.eq("city_id", cityOutcome.cityId);
    }

    // Service sub-filter.
    if (serviceTask) {
      const matchedSalonIds = [...new Set((serviceRes?.data ?? []).map((s: { salon_id: string }) => s.salon_id))];
      if (matchedSalonIds.length > 0) query = query.in("id", matchedSalonIds);
      else return emptyResult();
    }

    // Gender filter.
    if (genderTask) {
      const gIds = [...new Set((genderRes?.data ?? []).map((s: { salon_id: string }) => s.salon_id))];
      if (gIds.length > 0) query = query.in("id", gIds);
      else return emptyResult();
    }

    // Price filter.
    if (priceTask) {
      const priceIds = [...new Set((priceRes?.data ?? []).map((s: { salon_id: string }) => s.salon_id))];
      if (priceIds.length > 0) query = query.in("id", priceIds);
      else return emptyResult();
    }

    // Period filter.
    if (periodTask) {
      if (periodRes?.error) console.error("[api/salons GET] period RPC failed:", periodRes.error.message);
      const periodIds = ((periodRes?.data as Array<{ salon_id: string }>) ?? []).map((r) => r.salon_id);
      if (periodIds.length > 0) query = query.in("id", periodIds);
      else return emptyResult();
    }

    // instant_bookable filter.
    if (instantTask) {
      if (instantRes?.error) console.error("[api/salons GET] instant_bookable RPC failed:", instantRes.error.message);
      const availIds = ((instantRes?.data as Array<{ salon_id: string }>) ?? []).map((r) => r.salon_id);
      if (availIds.length > 0) query = query.in("id", availIds);
      else return emptyResult();
    }

    // date narrow-filter.
    if (dateTask) {
      if (dateRes?.error) console.error("[api/salons GET] date RPC failed:", dateRes.error.message);
      const dayIds = ((dateRes?.data as Array<{ salon_id: string }>) ?? []).map((r) => r.salon_id);
      if (dayIds.length > 0) query = query.in("id", dayIds);
      else return emptyResult();
    }

    // open_now filter (JS-evaluated against opening_hours).
    if (openNowTask) {
      const openIds = (openNowRes?.data ?? [])
        .filter((s: { opening_hours: unknown }) => isOpenNow(s.opening_hours as OpeningHours).isOpen)
        .map((s: { id: string }) => s.id as string);
      if (openIds.length > 0) query = query.in("id", openIds);
      else return emptyResult();
    }

    let distanceMap: Record<string, number> | null = null;
    let orderedIds: string[] | null = null;

    if (lat && lng) {
      const { data: nearbyData } = await supabase.rpc("get_nearby_salon_ids", {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        max_dist_meters: 50000 // 50km
      });
      if (nearbyData) {
        distanceMap = {};
        orderedIds = [];
        for (const row of nearbyData) {
          distanceMap[row.salon_id] = row.distance_meters;
          orderedIds.push(row.salon_id);
        }
        query = query.in("id", orderedIds);
      }
    }

    // semanticMode: no DB sort/range — the matched set (<=60 ids) is fetched whole and
    // ordered by relevance + paginated in JS at the end. Structured mode sorts+pages in DB.
    if (!semanticMode) {
      if (sort === "rating") query = query.order("solen_score", { ascending: false }).order("average_rating", { ascending: false });
      else if (sort === "price") query = query.order("created_at", { ascending: true }); // V1: mocked by created_at since price is in services
      else if (sort === "last_minute") query = query.order("last_minute_discount_percent", { ascending: false }).gt("last_minute_discount_percent", 0);
      else if (sort === "newest") query = query.order("created_at", { ascending: false });
      else if (sort === "distance") {
        // Distance sorting is handled post-fetch if `lat` and `lng` are provided.
        // We still fall back to solen_score to ensure deterministic fallback if distances are equal/unavailable.
        query = query.order("solen_score", { ascending: false });
      }
      else query = query.order("solen_score", { ascending: false }).order("average_rating", { ascending: false });

      query = query.range(offset, offset + limit - 1);
    }

    const { data: rawData, error, count } = await query;
    if (error) {
      console.error("[api/salons GET] query error:", error.message);
      return NextResponse.json({ items: [], total: 0, page, limit });
    }
    // The opaque-string select (staff_members embed) types `data` as an error union;
    // rows are read as Record<string,unknown> throughout, so cast once here (runtime
    // shape is the normal salon rows, curl-proven 2026-07-03).
    const data = rawData as unknown as Record<string, unknown>[] | null;

    // Date-based availability filtering
    let availableIds: Set<string> | null = null;
    let nextDates: Record<string, string> = {};

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Find salon IDs with available slots on the given date. DISTINCT salon_ids
      // via the hour-window RPC (0..24 = whole day) instead of pulling every slot
      // row for the day just to dedupe in JS. Reuse the date pre-query result when
      // it already resolved this exact day (the no-period date-narrow path).
      let availSlots: Array<{ salon_id: string }> | null = null;
      if (dateTask && dateRes && !dateRes.error) {
        availSlots = (dateRes.data as Array<{ salon_id: string }>) ?? [];
      } else {
        const { data: dayAvail, error: dayErr } = await supabase.rpc("salons_with_slot_in_hours", {
          p_start_hour: 0,
          p_end_hour: 24,
          p_from: `${date}T00:00:00`,
          p_to: `${date}T23:59:59`,
        });
        if (dayErr) console.error("[api/salons GET] date availability RPC failed:", dayErr.message);
        availSlots = (dayAvail as Array<{ salon_id: string }>) ?? [];
      }

      availableIds = new Set((availSlots ?? []).map((s: { salon_id: string }) => s.salon_id));

      // For unavailable salons, find next available date
      const salonIds = (data ?? []).map((s: Record<string, unknown>) => s.id as string);
      const unavailableIds = salonIds.filter((id) => !availableIds!.has(id));

      if (unavailableIds.length > 0) {
        // Ring 2b: single DISTINCT-ON RPC replaces the unbounded per-slot fetch (was
        // pulling every future available row , 1,470 rows to keep 6, silently
        // truncated at the PostgREST 1000-row cap). The RPC returns at most one row
        // per salon, already the earliest starts_at, bucketed as an Europe/Zurich
        // calendar day (to_char(... at time zone 'Europe/Zurich', 'YYYY-MM-DD')).
        // NOTE: this is an intentional convention change from the old
        // `starts_at.split("T")[0]` (raw UTC date) , the Zurich bucketing matches
        // /api/availability/unavailable-dates and /api/availability/time-slots,
        // which both already bucket in Zurich; the old UTC slice could show the
        // wrong "next available" day for evening slots near midnight.
        const { data: nextRows, error: nextErr } = await supabase.rpc("next_available_dates", {
          p_salon_ids: unavailableIds,
          p_after: `${date}T23:59:59`,
        });
        if (nextErr) {
          console.error("[api/salons GET] next_available_dates RPC failed:", nextErr.message);
        } else {
          for (const row of (nextRows ?? []) as Array<{ salon_id: string; next_date: string }>) {
            nextDates[row.salon_id] = row.next_date;
          }
        }
      }
    }

    // V3-D349: top services (category-preferred) + their next available slots,
    // for the Fresha-style booking card. Only when ?with_slots=1. Two-pass: pick
    // top 3 services per salon, batch-query slots by service_id, group (3 each),
    // attach as service.slots. Graceful on error so the list still renders.
    const topServicesBySalon: Record<string, Array<Record<string, unknown>>> = {};
    if (withSlots) {
      for (const salon of data ?? []) {
        const sid = (salon as Record<string, unknown>).id as string;
        const services =
          ((salon as Record<string, unknown>).services as Array<Record<string, unknown>>) ?? [];
        const sorted = [...services];
        if (serviceFilter) {
          sorted.sort(
            (a, b) => Number(b.category === serviceFilter) - Number(a.category === serviceFilter),
          );
        }
        topServicesBySalon[sid] = sorted.slice(0, 3);
      }
      const serviceIds = Object.values(topServicesBySalon)
        .flat()
        .map((s) => s.id as string);
      if (serviceIds.length > 0) {
        const nowIso = new Date().toISOString();
        const horizonIso = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
        // Ring 2d: was N parallel per-service .limit(3) queries; now ONE call to the live
        // `earliest_slots_by_service(p_service_ids, p_from, p_to, p_per)` RPC, which already
        // existed with zero callers (Ring 10 dead-RPC census). Live-DB discriminate check
        // (npx tsx, all 77 services with an available future slot, p_per 3 AND 1): the RPC's
        // per-service starts_at arrays are byte-identical to the old per-service query's
        // output (same status='available' filter, same time bounds, same earliest-N-ascending
        // ordering), and it is anon-callable (tested with the same anon key this route uses).
        const slotsByService: Record<string, string[]> = {};
        const { data: slotRpcRows, error: slotErr } = await supabase.rpc("earliest_slots_by_service", {
          p_service_ids: serviceIds,
          p_from: nowIso,
          p_to: horizonIso,
          p_per: 3,
        });
        if (slotErr) {
          console.error("[api/salons GET] next-slots RPC error:", slotErr.message);
        } else {
          for (const row of (slotRpcRows ?? []) as Array<{ service_id: string; starts_at: string }>) {
            if (!slotsByService[row.service_id]) slotsByService[row.service_id] = [];
            slotsByService[row.service_id].push(row.starts_at);
          }
        }
        for (const sid of Object.keys(topServicesBySalon)) {
          topServicesBySalon[sid] = topServicesBySalon[sid].map((s) => ({
            ...s,
            slots: slotsByService[s.id as string] ?? [],
          }));
        }
      }
    }

    // Compute avg_price from joined services. When ?with_slots=1, attach the top
    // services (each with its .slots) for the booking card.
    const items = (data ?? []).map((salon: Record<string, unknown>) => {
      const services = salon.services as Array<Record<string, unknown>> | null;
      const prices = (services ?? [])
        .map((s) => s.price as number)
        .filter((p) => typeof p === "number" && p > 0);
      const avg_price = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
      // "ab X CHF" map pills need the cheapest service price, not the average.
      const min_price = prices.length > 0 ? Math.min(...prices) : null;
      // ...and the NAME of the service that price belongs to, because a from-price without it is
      // not lawful advertising under Art. 13 PBV (SECO Wegleitung 2025 p.17: the concrete offer
      // must be described). Picked from the same rows min_price came from, so the two can never
      // disagree. Restored 2026-08-16 alongside the column selection above.
      // ...and the NAME of the service that price belongs to, in every locale. One shared rule
      // (lib/min-price-service.ts) rather than a second copy: the homepage computed this
      // independently and the two had already drifted to different locale coverage.
      const { names: minServiceNames } = minPriceService(services as PricedServiceRow[] | null);
      const min_price_service_de = minServiceNames.de;
      const min_price_service_en = minServiceNames.en;
      const min_price_service_fr = minServiceNames.fr;
      const min_price_service_it = minServiceNames.it;
      // R4-3: flatten ACTIVE staff specialties into a deduped string[] the client uses
      // for the specialization match-chip. Drop the raw staff_members embed from the
      // payload (only the flat specialties list is needed downstream). Absent/empty when
      // ?with_slots=1 was not set (embed not requested) or a salon has no active staff.
      const staffMembers = (salon.staff_members as Array<{ specialties?: string[] | null; is_active?: boolean }> | null) ?? null;
      const staff_specialties = staffMembers
        ? [...new Set(staffMembers.filter((m) => m.is_active !== false).flatMap((m) => m.specialties ?? []))]
        : [];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { services: _services, staff_members: _staff, ...rest } = salon;

      const salonId = salon.id as string;

      return {
        ...rest,
        avg_price,
        min_price,
        min_price_service_de,
        min_price_service_en,
        min_price_service_fr,
        min_price_service_it,
        ...(withSlots ? { staff_specialties } : {}),
        distance_meters: distanceMap ? distanceMap[salonId] : undefined,
        ...(withSlots ? { services: topServicesBySalon[salonId] ?? [] } : {}),
        ...(availableIds !== null
          ? {
              available_on_date: availableIds.has(salonId),
              next_available_date: availableIds.has(salonId) ? null : (nextDates[salonId] ?? null),
            }
          : {}),
      };
    });

    // semanticMode: order by relevance rank + paginate in JS (DB sort/range were skipped).
    if (semanticMode && rankIndex) {
      items.sort(
        (a, b) =>
          (rankIndex!.get((a as Record<string, unknown>).id as string) ?? 1e9) -
          (rankIndex!.get((b as Record<string, unknown>).id as string) ?? 1e9),
      );
      const paged = items.slice(offset, offset + limit);
      return NextResponse.json({ items: paged, total: items.length, page, limit }, { headers: ANON_CACHE_HEADERS });
    }

    if (sort === "distance" && distanceMap) {
      items.sort((a, b) => (a.distance_meters ?? Infinity) - (b.distance_meters ?? Infinity));
    } else if (sort === "price") {
      // V3-D384: real cheapest-first sort (line 157's DB order is only the fetch
      // order; min_price is computed post-fetch from services, so sort here).
      items.sort((a, b) => (a.min_price ?? Infinity) - (b.min_price ?? Infinity));
    }

    return NextResponse.json({ items, total: count ?? 0, page, limit }, { headers: ANON_CACHE_HEADERS });
  } catch (err) {
    console.error("[api/salons GET] error:", err);
    return NextResponse.json({ error: "Internal error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/salons — Create a new salon (onboarding)
export async function POST(request: NextRequest) {
  try {
    const disabled = await checkFeatureEnabled("registration");
    if (disabled) return disabled;

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const banned = await checkUserBanned(user.id);
    if (banned) return banned;

    const rateLimited = await applyRateLimit(authLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { data: validated, error: valError } = validateBody(createSalonSchema, body);
    if (valError) {
      return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const {
      name, email, categories, city, address, phone,
      cover_photo_url, gallery_urls, description_de, description_en, instagram_url, opening_hours,
      services, staff, availability_template,
      last_minute_discount_percent, last_minute_window_hours,
      latitude, longitude, google_place_id,
      website_url, tiktok_url, phone_verified, cancellation_policy,
    } = validated;

    const admin = createAdminSupabaseClient();

    // Generate slug from name with crypto-safe suffix + retry on collision
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let salon: { id: string } | null = null;
    let slug = "";

    let finalDescEn = description_en;
    if (description_de && !finalDescEn) {
      finalDescEn = await autoTranslateDescription(description_de);
    }

    const { data: cData } = await admin.from("cities").select("id").eq("slug", city).single();
    const city_id = cData?.id || null;

    for (let attempt = 0; attempt < 3; attempt++) {
      slug = baseSlug + "-" + crypto.randomUUID().slice(0, 8);

      const { data, error: insertErr } = await admin
        .from("salons")
        .insert({
          owner_id: user.id,
          name,
          slug,
          city_id,
          // quartier is nullable now (verified live schema 2026-07-01); the old hardcoded
          // "grossbasel" stamped a Basel neighborhood onto EVERY new salon (wrong for non-Basel
          // salons, and it surfaces in cards/PDP). Leave it null until it's a real value; downstream
          // (search/cards) already null-guards quartier.
          quartier: null,
          categories,
          address,
          phone: phone || null,
          // phone_verified: phone_verified || false, // [FIX] Bypassing schema cache error (defaults to false in DB)
          // Contact email + Google place ID are SAVED again (owner decision 1, TASTE_LOG 2026-08-09,
          // "1 A but is it legal" -> A, save both). They were commented out because the columns did
          // not exist on public.salons; migration 20260809130000 adds them, verified live before
          // this line was restored.
          email: email || user.email || null,
          cover_photo_url: cover_photo_url || null,
          gallery_urls: gallery_urls?.filter(Boolean) || [],
          description_de: description_de || null,
          description_en: finalDescEn || null,
          instagram_url: instagram_url || null,
          website_url: website_url || null,
          tiktok_url: tiktok_url || null, // column exists (verified live schema 2026-07-01); was dropping the onboarding value + the PDP reads it
          // opening_hours is validated as z.record(z.string(), z.unknown()) (arbitrary JSON shape),
          // cast to the generated Json column type (same pattern as app/api/salon-draft/route.ts).
          opening_hours: (opening_hours || {}) as Json,
          is_active: false, // Pending approval
          last_minute_discount_percent: last_minute_discount_percent || 0,
          last_minute_window_hours: last_minute_window_hours || 0,
          latitude: latitude || 47.5596,
          longitude: longitude || 7.5886,
          // Google PLACE ID ONLY. The taste-log condition on the same decision is that the ID may be
          // kept indefinitely but the copied name / address / phone / rating may not, so nothing
          // else from Places is written here.
          google_place_id: google_place_id || null,
          // cancellation_policy: cancellation_policy || null, // [FIX] Field not in public.salons schema
        })
        .select("id")
        .single();

      if (!insertErr && data) {
        salon = data;
        break;
      }
      if (insertErr && !insertErr.message?.includes("duplicate") && !insertErr.message?.includes("unique")) {
        console.error("[api/salons POST] salon insert:", insertErr.message);
        return NextResponse.json({ error: "Failed to create salon", message: insertErr.message, code: "DB_ERROR" }, { status: 500 });
      }
    }

    if (!salon) {
      console.error("[api/salons POST] slug collision after 3 attempts");
      return NextResponse.json({ error: "Failed to create salon", code: "DB_ERROR" }, { status: 500 });
    }

    const salonId = salon.id;

    // Insert services (select id back: availability_slots.service_id is NOT NULL, see below;
    // same fix pattern as app/api/admin/seed-test-salons/route.ts).
    let primaryServiceId: string | undefined;
    if (services?.length) {
      const serviceRows = services.map((s) => ({
        salon_id: salonId,
        name_de: s.name_de,
        // name_en is NOT NULL on the live services table, so the fallback is "" not null
        // (see migrations/20260530_seed_noncoiffeur_services.sql: "services has no name_fr/name_it",
        // those two were phantom columns here, dropped, they never existed on the table).
        name_en: s.name_en || "",
        category: s.category || categories[0],
        duration_minutes: s.duration_minutes || 60,
        price: s.price || 0,
        description_de: s.description_de || null,
        is_active: true,
      }));
      const { data: insertedServices } = await admin.from("services").insert(serviceRows).select("id");
      primaryServiceId = insertedServices?.[0]?.id;
    }

    // Insert staff
    if (staff?.length) {
      // "role" (job title, e.g. "Barber") is a phantom column here: staff_members never had
      // a "role" column (014_new_schema.sql), only "access_role" (a permission level, unused
      // elsewhere in the codebase), which is not an unambiguous match for a job-title input.
      // Dropped rather than mis-mapped; the field was never persisted before this fix either.
      const staffRows = staff.map((s) => ({
        salon_id: salonId,
        name: s.name,
        avatar_url: s.avatar_url || null,
        specialties: s.specialties || [],
        is_active: true,
      }));
      await admin.from("staff_members").insert(staffRows);
    }

    // Generate availability slots for 14 days, excluding breaks. Attached to the salon's
    // first created service: availability_slots.service_id is NOT NULL, previously unset
    // here, so this insert silently failed on every call (a genuinely missing required
    // field, not a phantom column; same fix as app/api/admin/seed-test-salons/route.ts).
    if (availability_template && primaryServiceId) {
      const slots: Database["public"]["Tables"]["availability_slots"]["Insert"][] = [];
      const now = new Date();

      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const date = new Date(now);
        date.setDate(date.getDate() + dayOffset);
        const dayIdx = date.getDay(); // 0=Sun
        const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dayIdx];

        const rawTmpl = availability_template[dayKey];
        if (!rawTmpl) continue;
        const tmpl = rawTmpl as { start: string; end: string; breaks?: { start: string; end: string }[] };

        const dateStr = date.toISOString().split("T")[0];
        const startMin = timeToMinutes(tmpl.start);
        const endMin = timeToMinutes(tmpl.end);
        const breaks: { start: string; end: string }[] = tmpl.breaks || [];

        // Generate 30-min slots, skipping breaks
        for (let m = startMin; m < endMin; m += 30) {
          const slotEnd = m + 30;
          if (slotEnd > endMin) break;

          // Check if slot overlaps with any break
          const inBreak = breaks.some(brk => {
            const bStart = timeToMinutes(brk.start);
            const bEnd = timeToMinutes(brk.end);
            return m < bEnd && slotEnd > bStart;
          });
          if (inBreak) continue;

          slots.push({
            salon_id: salonId,
            service_id: primaryServiceId,
            starts_at: `${dateStr}T${minutesToTime(m)}:00`,
            ends_at: `${dateStr}T${minutesToTime(slotEnd)}:00`,
            status: "available",
          });
        }
      }

      if (slots.length > 0) {
        // Insert in batches of 100
        for (let i = 0; i < slots.length; i += 100) {
          await admin.from("availability_slots").insert(slots.slice(i, i + 100));
        }
      }
    }

    // Update user profile with onboarding status, TOS tracking, and role upgrade (if applicable)
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    
    const updateData: Database["public"]["Tables"]["profiles"]["Update"] = {
      onboarding_completed: true,
      tos_accepted_version: CURRENT_TOS_VERSION,
      tos_accepted_at: new Date().toISOString()
    };
    
    if (profile?.role === "customer" || !profile?.role) {
      updateData.role = "salon_owner";
    }
    
    await admin.from("profiles").update(updateData).eq("id", user.id);

    // Send welcome email (fire-and-forget)
    const ownerEmail = email || user.email;
    if (ownerEmail) {
      sendEmail(onboardingWelcome(ownerEmail, { salonName: name }, "de")).catch((err) => console.error("[SalonsRoute] failed to send onboarding welcome email:", err));
    }

    return NextResponse.json({ id: salonId, slug });
  } catch (err) {
    console.error("[api/salons POST] error:", err);
    return NextResponse.json({ error: "Internal error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
