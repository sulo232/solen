export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { generalLimiter, authLimiter, applyRateLimit, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, createSalonSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { onboardingWelcome } from "@/lib/email-templates/salon-onboarding";
import { autoTranslateDescription } from "@/lib/ai/translate";
import { CURRENT_TOS_VERSION } from "@/lib/tos-version";
import { isOpenNow, type OpeningHours } from "@/lib/salon-hours";
import { generateEmbedding } from "@/lib/search/embeddings";

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
    const category = searchParams.get("category");
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
    const serviceFilter = searchParams.get("service");
    const q = searchParams.get("q")?.trim(); // free-text — semantic rank, combined with the filters below
    const period = searchParams.get("period"); // morning|noon|afternoon|evening — open-slot time-of-day filter

    // V3-D349: the category/search page (?with_slots=1) needs per-salon services
    // + next available slots for the Fresha-style booking card. Homepage feeds omit
    // the flag -> lighter payload (just price for avg_price).
    const withSlots = searchParams.get("with_slots") === "1";
    // NB: services has only name_de + name_en in the live DB (no name_fr/name_it).
    const servicesCols = withSlots
      ? "id, name_de, name_en, duration_minutes, price, category"
      : "price";

    const supabase = await createServerSupabaseClient();

    // Free-text: resolve semantic rank FIRST, then AND it with the structured filters
    // below (city / date / period / walk-in...). semanticMode skips the DB sort+range so
    // results come back in relevance order (sorted + paginated in JS at the end).
    let rankIndex: Map<string, number> | null = null;
    if (q && q.length >= 2) {
      let emb: string | null = null;
      try {
        emb = JSON.stringify(await generateEmbedding(q));
      } catch (e) {
        console.error("[api/salons GET] query embedding failed, lexical-only:", (e as Error).message);
      }
      const { data: ranked, error: rErr } = await supabase.rpc("search_salons_ranked", {
        p_q: q,
        p_limit: 60,
        p_query_embedding: emb,
      });
      if (rErr) console.error("[api/salons GET] search_salons_ranked failed:", rErr.message);
      const ids = (ranked ?? []).map((r: { salon_id: string }) => r.salon_id as string);
      if (ids.length === 0) return NextResponse.json({ items: [], total: 0, page, limit });
      rankIndex = new Map(ids.map((id: string, i: number): [string, number] => [id, i]));
    }
    const semanticMode = rankIndex !== null;

    let query = supabase
      .from("salons")
      .select(`*, services(${servicesCols})`, { count: "exact" })
      .eq("is_active", true)
      .eq("listed_on_marketplace", true)
      .eq("is_test", false);

    if (rankIndex) query = query.in("id", [...rankIndex.keys()]);

    if (category) query = query.contains("categories", [category]);
    
    if (city) {
      // Resolve the city by slug OR localized name, case-insensitive — the search overlay
      // sends the display name ("Zürich") while category pages send the slug ("zuerich").
      // Matching both means location filtering works from either entry point. (cities is tiny.)
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
      if (cityId) {
        query = query.eq("city_id", cityId);
      } else {
        // Non-empty city param resolved to no known city — return empty result
        return NextResponse.json({ items: [], total: 0, page, limit });
      }

      // Auto-hide test salons when real salons already exist for this city+category combo
      if (category && cityId) {
        const { count: realCount } = await supabase
          .from("salons")
          .select("id", { count: "exact", head: true })
          .eq("city_id", cityId)
          .contains("categories", [category])
          .eq("is_active", true)
          .eq("is_test", false);

        if ((realCount ?? 0) > 0) {
          // Real salons exist — hide test salons from results
          query = query.eq("is_test", false);
        }
        // else: no real salons → let test salons through (is_test filter already applied above)
      }
    }

    if (idsParam) {
      const idArray = idsParam.split(",").filter(id => id.trim() !== "");
      if (idArray.length > 0) {
        query = query.in("id", idArray);
      }
    }

    // Service sub-filter: filter to salons offering this service
    if (serviceFilter) {
      const servicePattern = `%${serviceFilter}%`;
      const { data: serviceMatches } = await supabase
        .from("services")
        .select("salon_id")
        .ilike("name_de", servicePattern)
        .eq("is_active", true);
      const matchedSalonIds = [...new Set((serviceMatches ?? []).map((s: { salon_id: string }) => s.salon_id))];
      if (matchedSalonIds.length > 0) {
        query = query.in("id", matchedSalonIds);
      } else {
        // No salons match this service — return empty
        return NextResponse.json({ items: [], total: 0, page, limit });
      }
    }

    if (min_rating) query = query.gte("average_rating", parseFloat(min_rating));
    if (accepts_payment === "true") query = query.eq("accepts_online_payment", true);

    // Filter to salons with availability slots in next 48 hours
    if (instant_bookable === "true") {
      const now = new Date().toISOString();
      const fortyEightHoursFromNow = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const { data: availSalons } = await supabase
        .from("availability_slots")
        .select("salon_id")
        .eq("status", "available")
        .gte("starts_at", now)
        .lte("starts_at", fortyEightHoursFromNow);
      const availIds = [...new Set((availSalons ?? []).map((s: { salon_id: string }) => s.salon_id))];
      if (availIds.length > 0) {
        query = query.in("id", availIds);
      } else {
        return NextResponse.json({ items: [], total: 0, page, limit });
      }
    }

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

    // Time-of-day filter: salons with >=1 available slot whose LOCAL hour falls in the
    // period window. If a date is set → that day's window; otherwise the next 14 days.
    // Slots are naive-local timestamps, so the hour is read straight off the ISO string.
    if (period && PERIOD_HOURS[period]) {
      const [startH, endH] = PERIOD_HOURS[period];
      const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date);
      const lo = validDate ? `${date}T00:00:00` : new Date().toISOString();
      const hi = validDate
        ? `${date}T23:59:59`
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      // DISTINCT salon_ids resolved in SQL via RPC — the old fetch-all-slots-then-JS-filter
      // truncated at PostgREST's row cap on the wide no-date (14-day) window, returning only
      // a few salons. The RPC does EXTRACT(hour) + DISTINCT server-side, so no cap.
      const { data: periodRows, error: periodErr } = await supabase.rpc("salons_with_slot_in_hours", {
        p_start_hour: startH,
        p_end_hour: endH,
        p_from: lo,
        p_to: hi,
      });
      if (periodErr) console.error("[api/salons GET] period RPC failed:", periodErr.message);
      const periodIds = (periodRows ?? []).map((r: { salon_id: string }) => r.salon_id);
      if (periodIds.length > 0) query = query.in("id", periodIds);
      else return NextResponse.json({ items: [], total: 0, page, limit });
    }

    // Open-now filter. "Open right now" depends on Zurich-local day/time vs the free-form
    // opening_hours jsonb (+ overnight wrap), which the shared isOpenNow helper computes in
    // JS — it can't be a PostgREST predicate. So resolve the open salon IDs first and
    // constrain with .in() BEFORE .range() below, exactly like instant_bookable, so count +
    // pagination stay correct (a client-side post-filter would only ever see one page).
    if (open_now === "true") {
      const { data: hoursRows } = await supabase
        .from("salons")
        .select("id, opening_hours")
        .eq("is_active", true)
        .eq("listed_on_marketplace", true)
        .eq("is_test", false);
      const openIds = (hoursRows ?? [])
        .filter((s: { opening_hours: unknown }) => isOpenNow(s.opening_hours as OpeningHours).isOpen)
        .map((s: { id: string }) => s.id as string);
      if (openIds.length > 0) {
        query = query.in("id", openIds);
      } else {
        return NextResponse.json({ items: [], total: 0, page, limit });
      }
    }

    // V3-D387: Service type / "Für wen" — salons with >=1 active service suitable
    // for the chosen gender (suitable_gender is a text[] like {male,female}).
    if (gender) {
      const { data: gRows } = await supabase
        .from("services")
        .select("salon_id")
        .eq("is_active", true)
        .contains("suitable_gender", [gender]);
      const gIds = [...new Set((gRows ?? []).map((s: { salon_id: string }) => s.salon_id))];
      if (gIds.length > 0) {
        query = query.in("id", gIds);
      } else {
        return NextResponse.json({ items: [], total: 0, page, limit });
      }
    }

    // V3-D387: amenity boolean filters — each query param maps 1:1 to a salons
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

    // V3-D384: Price filter — salons with >=1 active service in the [min,max]
    // band. Price lives in `services`, so resolve matching salon_ids first (same
    // pattern as instant_bookable above), then constrain the salon query.
    if (min_price || max_price) {
      let priceQ = supabase.from("services").select("salon_id").eq("is_active", true);
      if (min_price) priceQ = priceQ.gte("price", parseFloat(min_price));
      if (max_price) priceQ = priceQ.lte("price", parseFloat(max_price));
      const { data: priceRows } = await priceQ;
      const priceIds = [...new Set((priceRows ?? []).map((s: { salon_id: string }) => s.salon_id))];
      if (priceIds.length > 0) {
        query = query.in("id", priceIds);
      } else {
        return NextResponse.json({ items: [], total: 0, page, limit });
      }
    }

    // Date filter: narrow to salons with >=1 available slot on the chosen day.
    // Mirrors the period / instant_bookable pattern (resolve ids → query.in BEFORE
    // .range so count + pagination stay correct). Skipped when a period is set —
    // the period block above already restricts to that day's time window.
    // Owner 2026-06-13: picking a date should actually NARROW results, not just
    // annotate "next available" (the post-query block below still computes labels
    // for any non-date / multi-day views).
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !(period && PERIOD_HOURS[period])) {
      const { data: dayRows } = await supabase
        .from("availability_slots")
        .select("salon_id")
        .eq("status", "available")
        .gte("starts_at", `${date}T00:00:00`)
        .lt("starts_at", `${date}T23:59:59`);
      const dayIds = [...new Set((dayRows ?? []).map((s: { salon_id: string }) => s.salon_id))];
      if (dayIds.length > 0) query = query.in("id", dayIds);
      else return NextResponse.json({ items: [], total: 0, page, limit });
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

    const { data, error, count } = await query;
    if (error) {
      console.error("[api/salons GET] query error:", error.message);
      return NextResponse.json({ items: [], total: 0, page, limit });
    }

    // Date-based availability filtering
    let availableIds: Set<string> | null = null;
    let nextDates: Record<string, string> = {};

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Find salon IDs with available slots on the given date
      const { data: availSlots } = await supabase
        .from("availability_slots")
        .select("salon_id")
        .eq("status", "available")
        .gte("starts_at", `${date}T00:00:00`)
        .lt("starts_at", `${date}T23:59:59`);

      availableIds = new Set((availSlots ?? []).map((s: { salon_id: string }) => s.salon_id));

      // For unavailable salons, find next available date
      const salonIds = (data ?? []).map((s: Record<string, unknown>) => s.id as string);
      const unavailableIds = salonIds.filter((id) => !availableIds!.has(id));

      if (unavailableIds.length > 0) {
        const { data: nextSlots } = await supabase
          .from("availability_slots")
          .select("salon_id, starts_at")
          .eq("status", "available")
          .gt("starts_at", `${date}T23:59:59`)
          .in("salon_id", unavailableIds)
          .order("starts_at", { ascending: true });

        // Get the earliest next date per salon
        for (const slot of nextSlots ?? []) {
          const sid = (slot as { salon_id: string; starts_at: string }).salon_id;
          if (!nextDates[sid]) {
            nextDates[sid] = (slot as { starts_at: string }).starts_at.split("T")[0];
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
        const { data: upcoming, error: slotErr } = await supabase
          .from("availability_slots")
          .select("service_id, starts_at")
          .eq("status", "available")
          .in("service_id", serviceIds)
          .gte("starts_at", nowIso)
          .lte("starts_at", horizonIso)
          .order("starts_at", { ascending: true })
          .limit(3000);
        if (slotErr) {
          console.error("[api/salons GET] next-slots query error:", slotErr.message);
        } else {
          const slotsByService: Record<string, string[]> = {};
          for (const slot of upcoming ?? []) {
            const svcId = (slot as { service_id: string }).service_id;
            const ts = (slot as { starts_at: string }).starts_at;
            if (!slotsByService[svcId]) slotsByService[svcId] = [];
            if (slotsByService[svcId].length < 3) slotsByService[svcId].push(ts);
          }
          for (const sid of Object.keys(topServicesBySalon)) {
            topServicesBySalon[sid] = topServicesBySalon[sid].map((s) => ({
              ...s,
              slots: slotsByService[s.id as string] ?? [],
            }));
          }
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { services: _services, ...rest } = salon;

      const salonId = salon.id as string;

      return {
        ...rest,
        avg_price,
        min_price,
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
      return NextResponse.json({ items: paged, total: items.length, page, limit });
    }

    if (sort === "distance" && distanceMap) {
      items.sort((a, b) => (a.distance_meters ?? Infinity) - (b.distance_meters ?? Infinity));
    } else if (sort === "price") {
      // V3-D384: real cheapest-first sort (line 157's DB order is only the fetch
      // order; min_price is computed post-fetch from services, so sort here).
      items.sort((a, b) => (a.min_price ?? Infinity) - (b.min_price ?? Infinity));
    }

    return NextResponse.json({ items, total: count ?? 0, page, limit });
  } catch (err) {
    console.error("[api/salons GET] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/salons — Create a new salon (onboarding)
export async function POST(request: NextRequest) {
  try {
    const disabled = await checkFeatureEnabled("registration");
    if (disabled) return disabled;

    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
          quartier: "grossbasel", // [FIX] Bypassing BOTH Not-Null and legacy CHECK constraint
          categories,
          address,
          phone: phone || null,
          // phone_verified: phone_verified || false, // [FIX] Bypassing schema cache error (defaults to false in DB)
          // email: email || user.email || null, // [FIX] Field not in public.salons schema
          cover_photo_url: cover_photo_url || null,
          gallery_urls: gallery_urls?.filter(Boolean) || [],
          description_de: description_de || null,
          description_en: finalDescEn || null,
          instagram_url: instagram_url || null,
          website_url: website_url || null,
          // tiktok_url: tiktok_url || null, // [FIX] Field missing from cache or db schema
          opening_hours: opening_hours || {},
          is_active: false, // Pending approval
          last_minute_discount_percent: last_minute_discount_percent || 0,
          last_minute_window_hours: last_minute_window_hours || 0,
          latitude: latitude || 47.5596,
          longitude: longitude || 7.5886,
          // google_place_id: google_place_id || null, // [FIX] Field not in public.salons schema
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
        return NextResponse.json({ error: "Failed to create salon", message: insertErr.message }, { status: 500 });
      }
    }

    if (!salon) {
      console.error("[api/salons POST] slug collision after 3 attempts");
      return NextResponse.json({ error: "Failed to create salon" }, { status: 500 });
    }

    const salonId = salon.id;

    // Insert services
    if (services?.length) {
      const serviceRows = services.map((s: Record<string, unknown>) => ({
        salon_id: salonId,
        name_de: s.name_de,
        name_en: s.name_en || null,
        name_fr: s.name_fr || null,
        name_it: s.name_it || null,
        category: s.category || categories[0],
        duration_minutes: s.duration_minutes || 60,
        price: s.price || 0,
        description_de: s.description_de || null,
        is_active: true,
      }));
      await admin.from("services").insert(serviceRows);
    }

    // Insert staff
    if (staff?.length) {
      const staffRows = staff.map((s: Record<string, unknown>) => ({
        salon_id: salonId,
        name: s.name,
        avatar_url: s.avatar_url || null,
        specialties: (s.specialties as string[]) || [],
        role: s.role || null,
        is_active: true,
      }));
      await admin.from("staff_members").insert(staffRows);
    }

    // Generate availability slots for 14 days, excluding breaks
    if (availability_template) {
      const slots: Record<string, unknown>[] = [];
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
    
    // Using any type to dynamically attach role if needed
    const updateData: Record<string, any> = { 
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
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
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
