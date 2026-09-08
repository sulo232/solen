export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, adminLimiter, getAiDailyLimiter, getAiGlobalDailyLimiter, AI_GLOBAL_BUDGET_KEY, AI_GLOBAL_BUDGET_EXCEEDED_BODY } from "@/lib/ratelimit";
import { buildNailPrompt, type NailShotType } from "@/lib/nail/ai-prompts";
import { checkBudget, recordGeneration, getBudgetStatus } from "@/lib/nail/ai-budget";
import { validateBody, adminNailGenerateSchema } from "@/lib/validations";
import { getServerEnv } from "@/lib/env";
import { fetchSafeImage } from "@/lib/security/ssrf-guard";

// POST /api/admin/nail/generate — Admin-only AI nail art generation with budget tracking
export async function POST(req: NextRequest) {
  // 1. Feature flag
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  // 2. FAL_KEY check
  const falKey = getServerEnv().FAL_KEY;
  if (!falKey) {
    return NextResponse.json({ error: "AI Generation nicht verfügbar" }, { status: 503 });
  }

  // 3. Auth
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  // Global budget checked BEFORE the per-user cap, admin included: this route calls fal.ai for
  // a real per-image charge, and the whole point of a house-wide cost ceiling is that it bounds
  // TOTAL spend regardless of who is spending it. Unlike the separate CHF/month budget below
  // (checkBudget, whose admin-block behavior is now a stored, admin-editable setting, default
  // off, see lib/nail/ai-budget.ts and _backend-system/QUESTIONS.md Q2) this count-based global
  // cap does NOT bypass admin, exempting the only caller of an admin-gated route would make the
  // cap unenforceable for this route entirely.
  const globalLimited = await applyRateLimit(await getAiGlobalDailyLimiter(), { userId: AI_GLOBAL_BUDGET_KEY }, AI_GLOBAL_BUDGET_EXCEEDED_BODY);
  if (globalLimited) return globalLimited;

  const dailyLimited = await applyRateLimit(await getAiDailyLimiter(), { userId: user.id });
  if (dailyLimited) return dailyLimited;

  // 7. Budget check. Whether this blocks (this route is admin-only, checked in step 5 above)
  // is read from the stored nail_ai_budget_blocks_admin setting inside checkBudget(), not
  // passed in here, see lib/nail/ai-budget.ts.
  const budgetError = await checkBudget();
  if (budgetError) {
    // Real window: the monthly budget key (lib/nail/ai-budget.ts budgetKey()) is keyed by
    // calendar month, so it actually resets at the start of next month, not on a fixed
    // rolling duration. Retry-After reports the real seconds until that reset.
    const now = new Date();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const retryAfterSeconds = Math.max(1, Math.ceil((nextMonthStart.getTime() - now.getTime()) / 1000));
    return NextResponse.json({ error: budgetError }, {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    });
  }

  // 8. Parse + validate body
  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminNailGenerateSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { shape, style, colors, length, material, skinTone, shotType } = validated;

  // Map extended shotType values to valid NailShotType
  const validShotTypes: Record<string, "hero" | "detail" | "lifestyle"> = {
    hero: "hero", top_down: "detail", macro: "detail", lifestyle: "lifestyle",
  };
  const resolvedShotType = validShotTypes[shotType ?? "hero"] ?? "hero";

  try {
    // 9. Build prompt using template system
    const prompt = buildNailPrompt({
      shape: shape ?? "",
      length: length || "medium",
      material: material || "gel",
      style: style ?? "",
      colors: Array.isArray(colors) ? colors.join(", ") : "",
      skinTone: skinTone ?? undefined,
      shotType: resolvedShotType,
    });

    // 10. Call fal.ai via REST
    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: "square_hd",
        num_images: 1,
      }),
      // api-contracts-06: bound the outbound call so a hung fal.ai request
      // can't consume the whole serverless function wall-clock budget. This
      // is a stopgap timeout guard, not the 202+poll architecture the
      // reliability research recommends for AI-generation routes long-term.
      signal: AbortSignal.timeout(25000),
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
    // Also doubles as the discovery_staging.source_id (unique per source), same convention
    // as app/api/admin/discovery/upload/route.ts (source_id = the generated storage file name).
    const stagingSourceId = `ai-gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let storedUrl = imageUrl;
    try {
      // input-abuse-04 (2026-07-27): imageUrl is fal.ai's own generation-response URL, not
      // a hardcoded host, so guard against SSRF before the server-side fetch fires.
      // 8000ms: matches this codebase's existing timeout for fetching image bytes,
      // same value the fal.ai call above uses via its own sibling pattern (25000ms
      // there is for generation itself, not a byte download).
      const imgRes = await fetchSafeImage(imageUrl, { signal: AbortSignal.timeout(8000) });
      if (imgRes.ok) {
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        const fileName = `${stagingSourceId}.webp`;
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
    } catch (err) {
      console.error("[nail-ai-gen] Supabase upload failed, serving fal.ai URL:", err);
    }

    // 12. Create discovery staging entry
    // NOTE: `title` and `ai_result` were dropped here, they are not columns on discovery_staging
    // (see supabase/migrations/067_discovery.sql) so this insert previously errored on every call
    // (42703 unknown column), silently swallowed below via console.error. `source_id` (NOT NULL)
    // was also missing entirely, a second reason the insert always failed.
    const { data: staging, error: stagingErr } = await admin
      .from("discovery_staging")
      .insert({
        source: "ai_generated",
        source_id: stagingSourceId,
        source_url: imageUrl,
        image_url: storedUrl,
        category: "nails",
        status: "pending",
        auto_style: `${style} - ${shape} ${material || "gel"} Nails`,
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const budget = await getBudgetStatus();
  return NextResponse.json(budget);
}
