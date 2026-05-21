export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, translateSchema } from "@/lib/validations";
import { getServerEnv } from "@/lib/env";

// POST /api/translate — Translate a message using Gemini
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const apiKey = getServerEnv().GEMINI_API_KEY;
  if (!apiKey) return new NextResponse(null, { status: 204 });

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(translateSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { text, from, to } = validated;

  const fromLang = from || "de";

  // Support multi-language: to can be string or string[]
  const targetLangs: string[] = Array.isArray(to) ? to : to ? [to] : ["en", "fr", "it"];

  // Multi-language batch prompt (returns JSON)
  const isMulti = targetLangs.length > 1;
  const prompt = isMulti
    ? `Translate this salon/beauty service name. Return ONLY a JSON object with translations, no extra text.\nInput (${fromLang}): "${text}"\nOutput format: { ${targetLangs.map(l => `"${l}": "..."`).join(", ")} }`
    : `Translate this message from ${fromLang} to ${targetLangs[0]}. Return ONLY the translation, nothing else:\n"${text}"`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const result = await response.json();
    const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!raw) {
      return NextResponse.json({ error: "No translation" }, { status: 500 });
    }

    // Multi-language: parse JSON response
    if (isMulti) {
      try {
        // Strip markdown code fences if present
        const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
        const translations = JSON.parse(cleaned);
        return NextResponse.json({ translations, provider: "gemini" });
      } catch {
        // Fallback: return raw text as single translation
        return NextResponse.json({ translation: raw, provider: "gemini" });
      }
    }

    return NextResponse.json({ translation: raw, provider: "gemini" });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
