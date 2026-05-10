export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody } from "@/lib/validations";
import { extractSignalsFromHeaders } from "@/lib/ai/recommendations";
import { z } from "zod";

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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Rate limit: 10 req/min for authenticated users, 5 req/min for guests
  const identifier = user?.id || req.headers.get("x-forwarded-for") || "anonymous";
  const rateLimited = await applyRateLimit(generalLimiter, { userId: identifier });
  if (rateLimited) return rateLimited;

  if (user) {
    const banned = await checkUserBanned(user.id);
    if (banned) return banned;
  }

  // Check if Gemini is configured
  const apiKey = process.env.GEMINI_API_KEY;
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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
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

    const systemPrompt = `You are Solen's AI recommendation engine. You MUST rank these salons and provide a 1-sentence reason for EACH recommendation.

OUTPUT LANGUAGE: ${localeMap[locale]}

CONTEXT:
- User location: ${signals.location || "Basel"}
- Time of day: ${signals.timeOfDay}
- Day of week: ${signals.dayOfWeek}
- User booking history: ${bookingHistory.length > 0 ? bookingHistory.map((b) => `${b.category} at ${b.salon_name}`).join(", ") : "No history (cold start)"}

CANDIDATES (${candidates.length} salons):
${candidates.map((s, idx) => `${idx + 1}. ${s.name} (${s.quartier}, ${s.categories.join("/")}, ⭐${s.average_rating.toFixed(1)} from ${s.review_count} reviews)`).join("\n")}

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

    // Enrich with full salon data
    const salonIds = recommendations.map((r) => r.salon_id);
    const { data: enrichedSalons } = await supabase
      .from("salons")
      .select("*")
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
