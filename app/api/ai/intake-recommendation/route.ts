export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getAiDailyLimiter, getAiGlobalDailyLimiter, AI_GLOBAL_BUDGET_KEY } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, intakeRecommendationSchema } from "@/lib/validations";
import { getServerEnv } from "@/lib/env";
import { getActiveSalon } from "@/lib/active-salon";
import { wrapUntrustedInput } from "@/lib/ai/untrusted";

// POST /api/ai/intake-recommendation — Generate AI recommendation from intake responses
export async function POST(req: NextRequest) {
  const geminiKey = getServerEnv().GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // House-wide daily AI ceiling, checked before the per-user one. The per-user cap is a fairness
  // limit and a fresh account arrives with a fresh allowance, so only a shared counter bounds what
  // a single day can cost. One route first, on purpose: the rest follow once this one is verified.
  const globalAiLimited = await applyRateLimit(await getAiGlobalDailyLimiter(), { userId: AI_GLOBAL_BUDGET_KEY });
  if (globalAiLimited) return globalAiLimited;

  const dailyLimited = await applyRateLimit(await getAiDailyLimiter(), { userId: user.id });
  if (dailyLimited) return dailyLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(intakeRecommendationSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { intake_id } = validated;
  if (!intake_id) return NextResponse.json({ error: "intake_id required" }, { status: 400 });

  // Get the intake response
  const { data: intake } = await supabase
    .from("intake_form_responses")
    .select("*")
    .eq("id", intake_id)
    .single();

  if (!intake) return NextResponse.json({ error: "Intake not found" }, { status: 404 });

  // Verify salon ownership
  const salon = await getActiveSalon<{ id: string; name: string }>(supabase, user.id, "id, name");
  if (!salon || salon.id !== intake.salon_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // The customer's intake answers are untrusted and fenced as data (never instructions)
  // via the shared wrapUntrustedInput helper.
  const responsesText = Object.entries(intake.responses as Record<string, unknown>)
    .map(([q, a]) => `- ${q}: ${String(a)}`)
    .join("\n");

  const prompt = `Du bist ein erfahrener Friseur-Berater. Basierend auf den folgenden Kundenantworten aus einem Aufnahmebogen, gib eine professionelle Empfehlung auf Deutsch (max 200 Wörter):

Kategorie: ${intake.template_key}

${wrapUntrustedInput("Salonname und Kundenantworten", `Salon: ${salon.name}\n${responsesText}`)}

Gib eine konkrete, hilfreiche Empfehlung für den Stylisten, inklusive empfohlener Produkte und Techniken.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
        }),
        // 25000ms: text-generation call, same bound as app/api/admin/nail/generate/route.ts
        signal: AbortSignal.timeout(25000),
      }
    );

    const geminiData = await geminiRes.json();
    const recommendation = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!recommendation) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    // Save recommendation to the intake record
    const { error: updateError } = await supabase
      .from("intake_form_responses")
      .update({ ai_recommendation: recommendation })
      .eq("id", intake_id);

    if (updateError) {
      console.error("[ai/intake-recommendation] Failed to save recommendation:", updateError.message, { intake_id });
      return NextResponse.json({ error: "Failed to save recommendation" }, { status: 500 });
    }

    return NextResponse.json({ recommendation });
  } catch (err: any) {
    console.error("[ai/intake-recommendation] AI request failed:", err);
    return NextResponse.json({ error: `AI request failed: ${err.message}` }, { status: 500 });
  }
}
