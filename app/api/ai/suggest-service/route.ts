export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { z } from "zod";
import { validateBody } from "@/lib/validations";
import { getServerEnv } from "@/lib/env";

const suggestSchema = z.object({
  category: z.string().min(1).max(50),
});

// POST /api/ai/suggest-service — Suggest a popular service name for a salon category
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      makeup: "Event Make-up",
      waxing: "Ganzbein-Waxing",
    };
    return NextResponse.json({ suggestion: fallbacks[validated.category] || "Beratung + Behandlung" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(
      `Du bist ein Experte für Beauty-Salons in der Schweiz (Raum Basel). ` +
      `Für die Kategorie "${validated.category}" schlage EINEN einzelnen populären Service-Namen auf Deutsch vor. ` +
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
