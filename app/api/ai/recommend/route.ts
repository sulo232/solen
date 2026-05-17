export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody } from "@/lib/validations";
import { getServerEnv } from "@/lib/env";
import { z } from "zod";

const recommendSchema = z.object({
  template_key: z.string().min(1).max(100),
  intake_summary: z.string().min(1).max(5000),
});

// POST /api/ai/recommend — Generate AI recommendation from intake form
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const apiKey = getServerEnv().GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  const body = await req.json();
  const { data, error } = validateBody(recommendSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { template_key, intake_summary } = data;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Du bist ein erfahrener Beauty-Berater. Basierend auf dem folgenden Fragebogen (${template_key.replace("_", " ")}), gib eine personalisierte Empfehlung auf Deutsch. Sei konkret und professionell. Max 200 Wörter.

Kundenfragebogen:
${intake_summary}

Empfehlung:`;

    const result = await model.generateContent(prompt);
    const text = result.response?.text?.() ?? "";

    return NextResponse.json({ recommendation: text.trim() });
  } catch (e) {
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
