export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, intakeRecommendationSchema } from "@/lib/validations";

// POST /api/ai/intake-recommendation — Generate AI recommendation from intake responses
export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(intakeRecommendationSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { intake_id } = validated;

  // Get the intake response
  const { data: intake } = await supabase
    .from("intake_form_responses")
    .select("*")
    .eq("id", intake_id)
    .single();

  if (!intake) return NextResponse.json({ error: "Intake not found" }, { status: 404 });

  // Verify salon ownership
  const { data: salon } = await supabase.from("salons").select("id, name").eq("owner_id", user.id).single();
  if (!salon || salon.id !== intake.salon_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build prompt from intake responses
  const responsesText = Object.entries(intake.responses as Record<string, string>)
    .map(([q, a]) => `- ${q}: ${a}`)
    .join("\n");

  const prompt = `Du bist ein erfahrener Friseur-Berater. Basierend auf den folgenden Kundenantworten aus einem Aufnahmebogen, gib eine professionelle Empfehlung auf Deutsch (max 200 Wörter):

Salon: ${salon.name}
Kategorie: ${intake.template_key}

Kundenantworten:
${responsesText}

Gib eine konkrete, hilfreiche Empfehlung für den Stylisten, inklusive empfohlener Produkte und Techniken.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const recommendation = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!recommendation) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    // Save recommendation to the intake record
    await supabase
      .from("intake_form_responses")
      .update({ ai_recommendation: recommendation })
      .eq("id", intake_id);

    return NextResponse.json({ recommendation });
  } catch (err: any) {
    return NextResponse.json({ error: `AI request failed: ${err.message}` }, { status: 500 });
  }
}
