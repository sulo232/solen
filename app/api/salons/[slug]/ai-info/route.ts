export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getAiDailyLimiter, getAiGlobalDailyLimiter, AI_GLOBAL_BUDGET_KEY, AI_GLOBAL_BUDGET_EXCEEDED_BODY } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { getServerEnv } from "@/lib/env";
import { wrapUntrustedInput } from "@/lib/ai/untrusted";
import { validateBody, salonsAiInfoSchema } from "@/lib/validations";

// POST /api/salons/[slug]/ai-info
// Generate AI suggestions for salon description, atmosphere, expertise.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // Global budget checked BEFORE the per-user cap: a house-wide cost ceiling on top of the
  // per-user fairness limiter, see lib/ratelimit.ts:132.
  const globalLimited = await applyRateLimit(await getAiGlobalDailyLimiter(), { userId: AI_GLOBAL_BUDGET_KEY }, AI_GLOBAL_BUDGET_EXCEEDED_BODY);
  if (globalLimited) return globalLimited;

  const dailyLimited = await applyRateLimit(await getAiDailyLimiter(), { userId: user.id });
  if (dailyLimited) return dailyLimited;

  const admin = createAdminSupabaseClient();

  // Load salon and verify ownership
  const { data: salon } = await admin
    .from("salons")
    .select("id, owner_id, name, categories, quartier, address")
    .eq("slug", slug)
    .single();

  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  if (salon.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Load services for context
  const { data: services } = await admin
    .from("services")
    .select("name_de, category, price")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .limit(20);

  const serviceList = (services ?? []).map((s) => `${s.name_de} (${s.category}, CHF ${s.price})`).join(", ");

  const rawBody = await request.json().catch(() => ({}));
  const { data: validated } = validateBody(salonsAiInfoSchema, rawBody);
  const field = validated?.field ?? "description";

  const prompts: Record<string, string> = {
    description: `Schreibe eine kurze, einladende Beschreibung (max 200 Wörter, Deutsch) für den Salon ${wrapUntrustedInput("Salonname", salon.name)} in Basel (${wrapUntrustedInput("Quartier", salon.quartier)}). Kategorien: ${wrapUntrustedInput("Kategorien", salon.categories.join(", "))}. Services: ${wrapUntrustedInput("Services", serviceList || "noch keine")}.`,
    atmosphere: `Beschreibe die Atmosphäre des Salons ${wrapUntrustedInput("Salonname", salon.name)} in 1-2 Sätzen (Deutsch). Kategorien: ${wrapUntrustedInput("Kategorien", salon.categories.join(", "))}.`,
    expertise: `Beschreibe die Expertise des Salons ${wrapUntrustedInput("Salonname", salon.name)} in 1-2 Sätzen (Deutsch). Services: ${wrapUntrustedInput("Services", serviceList || "noch keine")}.`,
  };

  const prompt = prompts[field] ?? prompts.description;

  const geminiKey = getServerEnv().GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
        }),
        // 25000ms: text-generation call, same bound as app/api/admin/nail/generate/route.ts
        signal: AbortSignal.timeout(25000),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Gemini error: ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return NextResponse.json({ suggestion: text.trim(), field });
  } catch (err) {
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
