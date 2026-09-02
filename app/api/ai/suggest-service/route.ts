export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getGeminiModel } from "@/lib/ai/gemini";
import { applyRateLimit, generalLimiter, getAiDailyLimiter, getClientIp, getAiGlobalDailyLimiter, AI_GLOBAL_BUDGET_KEY, AI_GLOBAL_BUDGET_EXCEEDED_BODY } from "@/lib/ratelimit";
import { z } from "zod";
import { validateBody } from "@/lib/validations";
import { getServerEnv } from "@/lib/env";
import { wrapUntrustedInput } from "@/lib/ai/untrusted";

const suggestSchema = z.object({
  category: z.string().min(1).max(50),
});

// POST /api/ai/suggest-service — Suggest a popular service name for a salon category
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Global budget checked BEFORE the per-user cap: a house-wide cost ceiling on top of the
  // per-user fairness limiter, see lib/ratelimit.ts:132.
  const globalLimited = await applyRateLimit(await getAiGlobalDailyLimiter(), { userId: AI_GLOBAL_BUDGET_KEY }, AI_GLOBAL_BUDGET_EXCEEDED_BODY);
  if (globalLimited) return globalLimited;

  const dailyLimited = await applyRateLimit(await getAiDailyLimiter(), { userId: user.id });
  if (dailyLimited) return dailyLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(suggestSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  const apiKey = getServerEnv().GOOGLE_AI_API_KEY;
  if (!apiKey) {
    // Fallback suggestions when no API key
    const fallbacks: Record<string, string> = {
      coiffeur: "Waschen, Schneiden, Föhnen",
      barbershop: "Haarschnitt + Bart-Trim",
      nails: "Gel-Maniküre",
      spa: "Klassische Ganzkörpermassage",
    };
    return NextResponse.json({ suggestion: fallbacks[validated.category] || "Beratung + Behandlung" });
  }

  try {
    const model = getGeminiModel(apiKey, { model: "gemini-2.0-flash" });

    const result = await model.generateContent(
      `Du bist ein Experte für Beauty-Salons in der Schweiz (Raum Basel). ` +
      `Für die Kategorie ${wrapUntrustedInput("Kategorie", validated.category)} schlage EINEN einzelnen populären Service-Namen auf Deutsch vor. ` +
      `Nur der Name, keine Beschreibung, kein Preis. Beispiel: "Waschen, Schneiden, Föhnen". ` +
      `Antworte NUR mit dem Service-Namen, nichts anderes.`
    );

    const suggestion = result.response.text().trim().replace(/^["']|["']$/g, "");
    return NextResponse.json({ suggestion });
  } catch (err) {
    console.error("[api/ai/suggest-service] error:", err);
    return NextResponse.json({ suggestion: "Beratung + Behandlung" });
  }
}
