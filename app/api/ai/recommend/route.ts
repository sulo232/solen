export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

// POST /api/ai/recommend — Generate AI recommendation from intake form
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  const body = await req.json();
  const { template_key, intake_summary } = body;

  if (!template_key || !intake_summary) {
    return NextResponse.json({ error: "template_key and intake_summary required" }, { status: 400 });
  }

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
