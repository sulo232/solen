export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// POST /api/salons/[slug]/ai-info
// Generate AI suggestions for salon description, atmosphere, expertise.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const body = await request.json().catch(() => ({}));
  const field = body.field ?? "description";

  const prompts: Record<string, string> = {
    description: `Schreibe eine kurze, einladende Beschreibung (max 200 Wörter, Deutsch) für den Salon "${salon.name}" in Basel (${salon.quartier}). Kategorien: ${salon.categories.join(", ")}. Services: ${serviceList || "noch keine"}.`,
    atmosphere: `Beschreibe die Atmosphäre des Salons "${salon.name}" in 1-2 Sätzen (Deutsch). Kategorien: ${salon.categories.join(", ")}.`,
    expertise: `Beschreibe die Expertise des Salons "${salon.name}" in 1-2 Sätzen (Deutsch). Services: ${serviceList || "noch keine"}.`,
  };

  const prompt = prompts[field] ?? prompts.description;

  const geminiKey = process.env.GEMINI_API_KEY;
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
