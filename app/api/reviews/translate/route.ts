export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import {
  applyRateLimit,
  generalLimiter,
  getClientIp,
  getAiDailyLimiter,
  getAiGlobalDailyLimiter,
  AI_GLOBAL_BUDGET_KEY,
  AI_GLOBAL_BUDGET_EXCEEDED_BODY,
} from "@/lib/ratelimit";
import { validateBody, reviewTranslateSchema } from "@/lib/validations";
import { translateField, type TranslateLocale } from "@/lib/ai/translate";

// exists-check: `npm run exists review_translation` returned 0 matches before this was built.
// The nearest neighbours are lib/ai/translate.ts (the shared Gemini client, REUSED here rather
// than re-implemented) and app/api/reviews/[id]/photos (a different review sub-resource).
//
// POST /api/reviews/translate
//   { ids: string[], locale: "de"|"en"|"fr"|"it" } -> { translations: { [id]: string } }
//
// THE MODEL, and why it is on-read rather than on-write (the owner asked this directly):
// a review is written once and read by many, but MOST reviews are never read by someone in
// another language. Translating all 260 on write is money spent on text nobody asks for.
// First request in a foreign locale fills the cache; every later read is a table lookup.
//
// THE ORIGINAL IS NEVER REPLACED. This returns the translation as a SEPARATE field, and the
// caller shows "translated from X" with the original one tap away. A machine translation must
// never silently become what a customer said about a business.

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = await applyRateLimit(generalLimiter, { ip });
  if (limited) return limited;

  // This calls Gemini for a real generation, the same AI-cost category as app/api/translate
  // (lib/ratelimit.ts names "translate" by name in the routes that must carry a daily cap +
  // the global AI budget). That sibling route keys its per-user cap on the signed-in user id.
  // This route is fetched from a public salon page (SalonReviews.tsx) where the reader may be
  // signed out, so there is no user id to key on; applied per-IP instead of skipped, on the
  // SAME daily-cap limiter and the SAME house-wide budget, never a new one.
  const globalLimited = await applyRateLimit(await getAiGlobalDailyLimiter(), { userId: AI_GLOBAL_BUDGET_KEY }, AI_GLOBAL_BUDGET_EXCEEDED_BODY);
  if (globalLimited) return globalLimited;

  const dailyLimited = await applyRateLimit(await getAiDailyLimiter(), { ip });
  if (dailyLimited) return dailyLimited;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { data: validated, error: invalid } = validateBody(reviewTranslateSchema, raw);
  if (invalid) return NextResponse.json({ error: invalid.message }, { status: 400 });

  const { ids, locale } = validated;
  const admin = createAdminSupabaseClient();

  // 1. Cache first. On a warm page this is the only query that runs.
  const { data: cached } = await admin
    .from("review_translations")
    .select("review_id, translated")
    .eq("locale", locale)
    .in("review_id", ids);

  const out: Record<string, string> = {};
  for (const row of cached ?? []) out[row.review_id as string] = row.translated as string;

  // The cache carries no visibility state: a review can be hidden by moderation AFTER it was
  // translated and cached, and the cache-hit path used to return it anyway. Re-check the cached
  // ids against the live table with the same is_hidden filter the miss path applies below, and
  // drop anything hidden or gone. One extra query on the ids already in hand, never a per-row
  // loop, so the fast (all-cached) path stays one query away from what it was.
  const cachedIds = Object.keys(out);
  if (cachedIds.length > 0) {
    const { data: visible } = await admin
      .from("reviews")
      .select("id")
      .in("id", cachedIds)
      .eq("is_hidden", false);
    const visibleIds = new Set((visible ?? []).map((r) => r.id as string));
    for (const id of cachedIds) {
      if (!visibleIds.has(id)) delete out[id];
    }
  }

  const missing = ids.filter((id) => !out[id]);
  if (missing.length === 0) return NextResponse.json({ translations: out, cached: true });

  // 2. Fetch the originals for whatever is missing. is_hidden is checked here too, same as the
  //    cache-hit path above: a moderated-away review must not be translatable back into
  //    visibility from either path.
  const { data: reviews } = await admin
    .from("reviews")
    .select("id, comment")
    .in("id", missing)
    .eq("is_hidden", false);

  const toTranslate = (reviews ?? []).filter(
    (r) => typeof r.comment === "string" && r.comment.trim().length > 0,
  );
  if (toTranslate.length === 0) return NextResponse.json({ translations: out });

  // 3. Translate in parallel. Reviews are customer prose, so the "description" field rule
  //    applies: translate it, do not summarise or improve it.
  //    SOURCE LOCALE: reviews carry no language column and Solen's customers write German by
  //    default, so "de" is an assumption. A wrong one is benign , the instruction names the
  //    TARGET language and the text speaks for itself, so a French review asked to become
  //    Italian still becomes Italian.
  const results = await Promise.all(
    toTranslate.map((r) =>
      translateField(r.comment as string, "de", locale as TranslateLocale, "description"),
    ),
  );

  const rows: { review_id: string; locale: string; translated: string; source_locale: string }[] = [];
  toTranslate.forEach((r, i) => {
    const t = results[i];
    // "" is a failure. Never cache it: a cached failure is permanent, and the caller simply
    // shows the original, which is true.
    if (!t) return;
    out[r.id as string] = t;
    rows.push({ review_id: r.id as string, locale, translated: t, source_locale: "de" });
  });

  if (rows.length > 0) {
    const { error } = await admin
      .from("review_translations")
      .upsert(rows, { onConflict: "review_id,locale", ignoreDuplicates: true });
    if (error) console.error("[reviews/translate] cache write failed:", error);
  }

  return NextResponse.json({ translations: out, translated: rows.length });
}
