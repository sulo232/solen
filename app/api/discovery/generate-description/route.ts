import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryAdminLimiter } from "@/lib/ratelimit";
import { z } from "zod";
import { validateBody } from "@/lib/validations";
import { getServerEnv } from "@/lib/env";

const schema = z.object({ item_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin check
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(discoveryAdminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(schema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // Fetch item
  const { data: item } = await supabase
    .from("discovery_items")
    .select("*")
    .eq("id", data.item_id)
    .single();

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Generate descriptions via Gemini
  const apiKey = getServerEnv().GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });

  const context = [
    item.style_name && `Style: ${item.style_name}`,
    item.category && `Category: ${item.category}`,
    item.gender && `Gender: ${item.gender}`,
    item.texture && `Texture: ${item.texture}`,
    item.tags?.length && `Tags: ${item.tags.join(", ")}`,
    item.vibe && `Vibe: ${item.vibe}`,
    item.occasion && `Occasion: ${item.occasion}`,
  ].filter(Boolean).join(". ");

  const prompt = `You are a beauty & wellness content writer for solen.ch (Basel, Switzerland).
Generate a short, engaging description (2-3 sentences) for this beauty/wellness item in 4 languages.
Also generate a "salon script" — what the customer should say to their stylist to get this look.

Context: ${context}

Return ONLY valid JSON:
{
  "description_de": "...",
  "description_en": "...",
  "description_fr": "...",
  "description_it": "...",
  "salon_script": "...",
  "salon_script_de": "...",
  "salon_script_fr": "...",
  "salon_script_it": "..."
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) {
      console.error("[generate-description] Gemini error:", await res.text());
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const result = await res.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });

    const descriptions = JSON.parse(jsonMatch[0]);

    // Update item with generated descriptions
    const { error: updateError } = await supabase
      .from("discovery_items")
      .update({
        description_de: descriptions.description_de,
        description_en: descriptions.description_en,
        description_fr: descriptions.description_fr,
        description_it: descriptions.description_it,
        salon_script: descriptions.salon_script,
        salon_script_de: descriptions.salon_script_de,
        salon_script_fr: descriptions.salon_script_fr,
        salon_script_it: descriptions.salon_script_it,
      })
      .eq("id", data.item_id);

    if (updateError) {
      console.error("[generate-description] Update error:", updateError);
      return NextResponse.json({ error: "Failed to save descriptions" }, { status: 500 });
    }

    return NextResponse.json({ success: true, descriptions });
  } catch (err) {
    console.error("[generate-description] Error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
