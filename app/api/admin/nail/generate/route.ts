export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";

// POST /api/admin/nail/generate — Admin-only AI nail art generation
export async function POST(req: NextRequest) {
  if (!process.env.FAL_KEY) {
    return NextResponse.json({ error: "AI Generation nicht verfügbar" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin check
  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { shape, style, colors, length, material, skin_tone, hand_pose } = body;

  if (!shape || !style) {
    return NextResponse.json({ error: "shape and style required" }, { status: 400 });
  }

  // Build prompt
  const prompt = [
    "Professional nail art photography, studio lighting, clean background.",
    `Nail shape: ${shape}.`,
    `Style: ${style}.`,
    length ? `Length: ${length}.` : "",
    material ? `Material: ${material}.` : "",
    colors ? `Colors: ${colors}.` : "",
    skin_tone ? `Skin tone: ${skin_tone}.` : "",
    hand_pose || "Elegant hand pose showing all five nails.",
    "High resolution, macro detail, beauty photography aesthetic.",
  ].filter(Boolean).join(" ");

  try {
    // Call fal.ai
    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: "square_hd",
        num_images: 1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[nail-ai-gen] fal.ai error:", errText);
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }

    const result = await response.json();
    const imageUrl = result.images?.[0]?.url;
    if (!imageUrl) return NextResponse.json({ error: "No image generated" }, { status: 500 });

    // Create discovery staging entry
    const { data: staging, error } = await admin
      .from("discovery_staging")
      .insert({
        source: "ai_generated",
        source_url: imageUrl,
        image_url: imageUrl,
        title: `${style} ${shape} Nails`,
        category: "nails",
        status: "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      staging,
      imageUrl,
      prompt,
    }, { status: 201 });
  } catch (err) {
    console.error("[nail-ai-gen] Error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
