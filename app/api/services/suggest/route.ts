import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/ai/gemini";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { applyRateLimit, generalLimiter, getAiDailyLimiter, getAiGlobalDailyLimiter, AI_GLOBAL_BUDGET_KEY, AI_GLOBAL_BUDGET_EXCEEDED_BODY } from "@/lib/ratelimit";
import { wrapUntrustedInput } from "@/lib/ai/untrusted";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    // Global budget checked BEFORE the per-user cap: a house-wide cost ceiling on top of the
    // per-user fairness limiter, see lib/ratelimit.ts:132.
    const globalLimited = await applyRateLimit(await getAiGlobalDailyLimiter(), { userId: AI_GLOBAL_BUDGET_KEY }, AI_GLOBAL_BUDGET_EXCEEDED_BODY);
    if (globalLimited) return globalLimited;

    const dailyLimited = await applyRateLimit(await getAiDailyLimiter(), { userId: user.id });
    if (dailyLimited) return dailyLimited;

    const { searchParams } = new URL(request.url);
    const categories = searchParams.get("categories") || "hair";

    const apiKey = getServerEnv().GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini not configured" }, { status: 500 });
    }

    const model = getGeminiModel(apiKey, { model: "gemini-2.5-flash" });

    const prompt = `You are a salon expert in Switzerland. Generate exactly 5 standard, popular services for a salon with the following categories: ${wrapUntrustedInput("categories", categories)}.
    
    CRITICAL RULES:
    1. Output ONLY a valid JSON array of objects. No markdown, no backticks, no text.
    2. Prices must be realistic for Switzerland in CHF (e.g., Men's Cut 40-70, Women's Cut 60-120, Balayage 150-300).
    3. The JSON structure for each object must be exactly:
    {
      "name_de": "string (German name)",
      "duration_minutes": number (15, 30, 45, 60, etc.),
      "price": number
    }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ suggestions: parsed });
  } catch (err) {
    console.error("[api/services/suggest] Error:", err);
    return NextResponse.json({ error: "Failed to generate suggestions", suggestions: [] }, { status: 500 });
  }
}
