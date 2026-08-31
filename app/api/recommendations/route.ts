export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getGeminiModel } from "@/lib/ai/gemini";
import { applyRateLimit, generalLimiter, getAiDailyLimiter, getClientIp, getAiGlobalDailyLimiter, AI_GLOBAL_BUDGET_KEY, AI_GLOBAL_BUDGET_EXCEEDED_BODY } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody } from "@/lib/validations";
import { extractSignalsFromHeaders } from "@/lib/ai/recommendations";
import { getServerEnv } from "@/lib/env";
import { z } from "zod";
import { wrapUntrustedInput } from "@/lib/ai/untrusted";

const recommendationRequestSchema = z.object({
  viewedSalonIds: z.array(z.string()).max(10).optional(), // Last 5-10 viewed salons from localStorage
  locale: z.enum(["de", "en", "fr", "it"]).default("de"),
});

interface RecommendationResult {
  salon_id: string;
  salon_name: string;
  reason_text: string;
  score: number;
}

/**
 * GET /api/recommendations
 *
 * AI-powered salon recommendations using:
 * - User booking history (past categories)
 * - Last viewed salons (from localStorage)
 * - Location signals (edge geo headers — Netlify x-nf-geo with Vercel x-vercel-ip-city legacy fallback)
 * - Time of day context
 *
 * Gemini 2.0 Flash ranks candidates and generates locale-aware reason text.
 * Cold start fallback: trending salons in Basel.
 */
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Rate limit: 10 req/min for authenticated users, 5 req/min for guests
  const identifier = user?.id || getClientIp(req);
  const rateLimited = await applyRateLimit(generalLimiter, { userId: identifier });
  if (rateLimited) return rateLimited;

  if (user) {
    const banned = await checkUserBanned(user.id);
    if (banned) return banned;
  }

  // Global budget checked BEFORE the per-user/per-IP cap: a house-wide cost ceiling on top of
  // the per-caller fairness limiter, see lib/ratelimit.ts:132.
  const globalLimited = await applyRateLimit(await getAiGlobalDailyLimiter(), { userId: AI_GLOBAL_BUDGET_KEY }, AI_GLOBAL_BUDGET_EXCEEDED_BODY);
  if (globalLimited) return globalLimited;

  const aiDailyLimiter = await getAiDailyLimiter();
  const dailyLimited = user
    ? await applyRateLimit(aiDailyLimiter, { userId: user.id })
    : await applyRateLimit(aiDailyLimiter, { ip: getClientIp(req) });
  if (dailyLimited) return dailyLimited;

  // Check if Gemini is configured
  const apiKey = getServerEnv().GEMINI_API_KEY;
  if (!apiKey) {
    // Graceful degradation: return empty state without crashing
    return NextResponse.json({
      recommendations: [],
      fallback: true,
      message: "AI recommendations temporarily unavailable"
    });
  }

  // Extract baseline signals
  const signals = extractSignalsFromHeaders(req.headers);

  // Parse query params
  const { searchParams } = new URL(req.url);
  const viewedSalonIdsRaw = searchParams.get("viewedSalonIds"); // JSON array string
  const locale = (searchParams.get("locale") || "de") as "de" | "en" | "fr" | "it";

  const viewedSalonIds: string[] = viewedSalonIdsRaw
    ? JSON.parse(viewedSalonIdsRaw).slice(0, 10)
    : [];

  try {
    // 1. Fetch user booking history (last 5 bookings with categories)
    let bookingHistory: { category: string; salon_name: string }[] = [];
    if (user) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select(`
          id,
          service:services(category),
          salon:salons(name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      bookingHistory = (bookings || [])
        .filter((b: any) => b.service?.category && b.salon?.name)
        .map((b: any) => ({
          category: b.service.category,
          salon_name: b.salon.name,
        }));
    }

    // 2. Fetch candidate salons
    let candidates: any[] = [];

    if (bookingHistory.length > 0) {
      // Strategy A: Match categories from booking history
      const categories = [...new Set(bookingHistory.map((b) => b.category))];
      const { data: matchedSalons } = await supabase
        .from("salons")
        .select("id, name, slug, quartier, average_rating, review_count, categories, cover_photo_url")
        .eq("is_active", true)
        .contains("categories", categories)
        .order("average_rating", { ascending: false })
        .limit(20);

      candidates = matchedSalons || [];
    }

    // Cold start fallback: trending salons in Basel
    if (candidates.length < 3) {
      const { data: trendingSalons } = await supabase
        .from("salons")
        .select("id, name, slug, quartier, average_rating, review_count, categories, cover_photo_url")
        .eq("is_active", true)
        .order("review_count", { ascending: false })
        .order("average_rating", { ascending: false })
        .limit(10);

      candidates = trendingSalons || [];
    }

    // Filter out already viewed salons
    candidates = candidates.filter((s) => !viewedSalonIds.includes(s.id));

    if (candidates.length === 0) {
      return NextResponse.json({
        recommendations: [],
        fallback: true,
        message: "No new recommendations available"
      });
    }

    // 3. Call Gemini to rank top 3-4 and generate reason_text
    const model = getGeminiModel(apiKey, {
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const localeMap = {
      de: "German",
      en: "English",
      fr: "French",
      it: "Italian",
    };

    // input-abuse-06 (2026-07-27): location comes from a client-controlled geo header,
    // and salon name/quartier are salon-owner-editable DB fields, so both trace back
    // outside Solen's own trust boundary. Fenced as data so an injected instruction in
    // either one cannot redirect the ranking or the reason text.
    const untrustedContext = [
      `User location: ${signals.location || "Basel"}`,
      `User booking history: ${bookingHistory.length > 0 ? bookingHistory.map((b) => `${b.category} at ${b.salon_name}`).join(", ") : "No history (cold start)"}`,
      `CANDIDATES (${candidates.length} salons):`,
      candidates.map((s, idx) => `${idx + 1}. ${s.name} (${s.quartier}, ${s.categories.join("/")}, ${s.average_rating.toFixed(1)} stars from ${s.review_count} reviews)`).join("\n"),
    ].join("\n");

    const systemPrompt = `You are Solen's AI recommendation engine. You MUST rank these salons and provide a 1-sentence reason for EACH recommendation.

OUTPUT LANGUAGE: ${localeMap[locale]}

Time of day: ${signals.timeOfDay}
Day of week: ${signals.dayOfWeek}

${wrapUntrustedInput("RECOMMENDATION_CONTEXT", untrustedContext)}

INSTRUCTIONS:
1. Rank the top 3-4 salons based on:
   - Category match with user history (if available)
   - Rating + review count
   - Location proximity (prioritize user's quartier if known)
   - Time/day context (e.g., suggest late-night salons in the evening)
2. For EACH recommended salon, generate a 1-sentence reason in ${localeMap[locale]}.
3. IMPORTANT: Only use the provided user history. Do NOT invent past visits or bookings that are not listed above.
4. Return STRICT JSON format:
{
  "recommendations": [
    {
      "salon_id": "uuid",
      "reason_text": "One sentence in ${localeMap[locale]}",
      "score": 0.95
    }
  ]
}`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response?.text?.() ?? "{}";
    const parsed = JSON.parse(responseText);

    const recommendations: RecommendationResult[] = (parsed.recommendations || [])
      .slice(0, 4)
      .map((r: any) => ({
        salon_id: r.salon_id,
        salon_name: candidates.find((c) => c.id === r.salon_id)?.name || "Unknown",
        reason_text: r.reason_text || "",
        score: r.score || 0,
      }));

    // Enrich with public salon data only. Explicit public column list, same shape
    // as app/api/salons/route.ts (selectStr) / app/api/salons/search/route.ts.
    // Replaces select('*') which shipped all ~98 salon columns to this unauthenticated
    // response, including owner/payment internals. Never select search_doc,
    // score_details, stripe_account_id, owner_id here.
    const salonIds = recommendations.map((r) => r.salon_id);
    const { data: enrichedSalons } = await supabase
      .from("salons")
      .select(
        "id, slug, name, cover_photo_url, gallery_urls, categories, address, postal_code, quartier, latitude, longitude, opening_hours, average_rating, review_count, last_minute_discount_percent, walkin_enabled, accepts_online_payment, solen_score, created_at",
      )
      .in("id", salonIds);

    const enrichedRecommendations = recommendations.map((r) => {
      const salon = enrichedSalons?.find((s) => s.id === r.salon_id);
      return {
        ...salon,
        ai_reason: r.reason_text,
        ai_score: r.score,
      };
    });

    return NextResponse.json({
      recommendations: enrichedRecommendations,
      fallback: false,
      signals,
    });
  } catch (e: any) {
    console.error("[/api/recommendations] Error:", e.message);
    return NextResponse.json({
      recommendations: [],
      fallback: true,
      message: "AI recommendation engine error"
    }, { status: 500 });
  }
}
