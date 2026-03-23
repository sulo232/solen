import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { analyzeDiscoveryImage, analyzeDiscoveryTikTok } from "@/lib/ai-vision";
import { validateBody, adminDiscoveryBackfillSchema } from "@/lib/validations";

/**
 * POST /api/admin/discovery/backfill
 * Re-analyzes existing items with Gemini and backfills AI fields.
 * Also fixes content_type for items with TikTok data.
 * Admin-only.
 */
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  // Auth + admin role check
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // Check for Gemini API key early
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured. Add it to Vercel Environment Variables." },
      { status: 500 }
    );
  }

  const admin = createAdminSupabaseClient();
  const body = await req.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(adminDiscoveryBackfillSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const limit = Math.min(validated.limit ?? 10, 50);
  const force = validated.force === true; // Re-analyze even items that already have a style_name

  // Find items that need AI backfill
  let query = admin
    .from("discovery_items")
    .select("*")
    .eq("status", "published")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Unless force=true, only process items without a style_name
  if (!force) {
    query = query.is("style_name", null);
  }

  const { data: items } = await query;

  if (!items || items.length === 0) {
    return NextResponse.json({ message: "No items to backfill", processed: 0 });
  }

  let processed = 0;
  let errors = 0;
  const results: { id: string; style_name: string | null; status: string }[] = [];

  for (const item of items) {
    try {
      // Fix content_type for TikTok items stored as "curated"
      const isTikTok = !!item.tiktok_url || !!item.tiktok_embed_html || item.media_type === "tiktok";
      const correctContentType = isTikTok ? "tiktok" : item.content_type;

      // Analyze with Gemini — inline for better error tracking
      const imageUrl = item.image_url || item.tiktok_thumbnail_url;
      if (!imageUrl) {
        results.push({ id: item.id, style_name: null, status: "skipped_no_image" });
        continue;
      }

      // Test if image is fetchable
      let imageRes;
      try {
        imageRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
      } catch (fetchErr) {
        results.push({ id: item.id, style_name: null, status: `image_fetch_error: ${String(fetchErr)}` });
        errors++;
        continue;
      }
      if (!imageRes.ok) {
        results.push({ id: item.id, style_name: null, status: `image_http_${imageRes.status}` });
        errors++;
        continue;
      }

      let aiResult;
      try {
        if (isTikTok) {
          aiResult = await analyzeDiscoveryTikTok(imageUrl, item.alt_text ?? "", item.tiktok_url ?? undefined);
        } else {
          aiResult = await analyzeDiscoveryImage(imageUrl);
        }
      } catch (aiErr) {
        results.push({ id: item.id, style_name: null, status: `gemini_error: ${String(aiErr)}` });
        errors++;
        continue;
      }

      if (!aiResult) {
        results.push({ id: item.id, style_name: null, status: "ai_returned_null_check_logs" });
        errors++;
        continue;
      }

      // Update the item with AI data
      // products_needed is now an object (texture-adaptive), use products_flat for DB
      const productsFlat = aiResult.products_flat
        ?? (Array.isArray(aiResult.products_needed) ? aiResult.products_needed : []);

      const { error } = await admin
        .from("discovery_items")
        .update({
          content_type: correctContentType,
          category: aiResult.category ?? item.category,
          gender: aiResult.gender ?? item.gender,
          texture: aiResult.texture ?? item.texture,
          style_name: aiResult.style_name,
          tags: aiResult.tags?.length > 0 ? aiResult.tags : item.tags,
          maintenance: aiResult.maintenance_level ?? item.maintenance,
          face_shapes: aiResult.face_shapes?.length > 0 ? aiResult.face_shapes : item.face_shapes,
          products_needed: productsFlat,
          hair_type_match: aiResult.hair_type_match ?? [],
          description_en: aiResult.description_en,
          description_de: aiResult.description_de,
          description_fr: aiResult.description_fr,
          description_it: aiResult.description_it,
          salon_script_de: aiResult.salon_script_de,
          cut_guide: aiResult.cut_guide,
          price_min: aiResult.price_min ?? item.price_min,
          price_max: aiResult.price_max ?? item.price_max,
          // Store the full rich AI analysis as JSONB
          ai_analysis: aiResult,
        })
        .eq("id", item.id);

      if (error) {
        results.push({ id: item.id, style_name: aiResult.style_name, status: `db_error: ${error.message}` });
        errors++;
      } else {
        results.push({ id: item.id, style_name: aiResult.style_name, status: "updated" });
        processed++;
      }
    } catch (e) {
      results.push({ id: item.id, style_name: null, status: `error: ${String(e)}` });
      errors++;
    }
  }

  return NextResponse.json({
    message: `Backfill complete. ${processed} updated, ${errors} errors.`,
    processed,
    errors,
    total: items.length,
    results,
  });
}
