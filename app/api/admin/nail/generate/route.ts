export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { buildNailPrompt, type NailShotType } from "@/lib/nail/ai-prompts";
import { checkBudget, recordGeneration, getBudgetStatus } from "@/lib/nail/ai-budget";
import { validateBody, adminNailGenerateSchema } from "@/lib/validations";

// POST /api/admin/nail/generate — Admin-only AI nail art generation with budget tracking
export async function POST(req: NextRequest) {
  // 1. Feature flag
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  // 2. FAL_KEY check
  if (!process.env.FAL_KEY) {
    return NextResponse.json({ error: "AI Generation nicht verfügbar" }, { status: 503 });
  }

  // 3. Auth
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 4. Ban check
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // 5. Admin role check
  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 6. Rate limit
  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 7. Budget check (admin bypasses block but warnings are logged)
  const budgetError = await checkBudget(true);
  if (budgetError) {
    return NextResponse.json({ error: budgetError }, { status: 429 });
  }

  // 8. Parse + validate body
  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminNailGenerateSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { shape, style, colors, length, material, skinTone, shotType } = validated;

  try {
    // 9. Build prompt using template system
    const prompt = buildNailPrompt({
      shape,
      length: length || "medium",
      material: material || "gel",
      style,
      colors,
      skinTone,
      shotType: shotType || "hero",
    });

    // 10. Call fal.ai via REST
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

    // 11. Download and re-upload to Supabase Storage for persistence
    let storedUrl = imageUrl;
    try {
      const imgRes = await fetch(imageUrl);
      if (imgRes.ok) {
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        const fileName = `ai-gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
        const { error: uploadErr } = await admin.storage
          .from("nail-portfolio-images")
          .upload(fileName, imgBuffer, { contentType: "image/webp", upsert: false });

        if (!uploadErr) {
          const { data: pubUrl } = admin.storage
            .from("nail-portfolio-images")
            .getPublicUrl(fileName);
          storedUrl = pubUrl.publicUrl;
        }
      }
    } catch {
      // Fallback to fal.ai URL if upload fails
    }

    // 12. Create discovery staging entry
    const { data: staging, error: stagingErr } = await admin
      .from("discovery_staging")
      .insert({
        source: "ai_generated",
        source_url: imageUrl,
        image_url: storedUrl,
        title: `${style} – ${shape} ${material || "gel"} Nails`,
        category: "nails",
        status: "pending",
        ai_result: { prompt, model: "fal-ai/flux/schnell", params: body },
      })
      .select("id")
      .single();

    if (stagingErr) {
      console.error("[nail-ai-gen] Staging insert error:", stagingErr);
    }

    // 13. Record budget usage
    await recordGeneration();
    const budget = await getBudgetStatus();

    return NextResponse.json({
      staging_id: staging?.id ?? null,
      image_url: storedUrl,
      prompt,
      budget: { spent: budget.spent, budget: budget.budget, percentUsed: budget.percentUsed },
    }, { status: 201 });
  } catch (err) {
    console.error("[nail-ai-gen] Error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}

// GET /api/admin/nail/generate — Return current AI generation budget status
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const budget = await getBudgetStatus();
  return NextResponse.json(budget);
}
