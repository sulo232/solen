export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { analyzeDiscoveryImage, analyzeDiscoveryTikTok, translateDiscoveryI18n } from "@/lib/ai-vision";
import { validateBody, adminDiscoveryBackfillSchema } from "@/lib/validations";
import { getServerEnv } from "@/lib/env";
import { fetchSafeImage } from "@/lib/security/ssrf-guard";

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // Check for Gemini API key early
  if (!getServerEnv().GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured. Add it to Netlify Environment Variables." },
      { status: 500 }
    );
  }

  const admin = createAdminSupabaseClient();

  // --- mode=i18n: translate existing looks' cut-script (de) + products (en) into all 4 langs (no re-analysis). One
  //     cheap Gemini translate call per look; idempotent (only items missing salon_script_en). ---
  if (req.nextUrl.searchParams.get("mode") === "i18n") {
    const { data: rows } = await admin
      .from("discovery_items")
      .select("id, salon_script_de, products_needed")
      .eq("is_active", true)
      .is("salon_script_en", null)
      .limit(50);
    if (!rows || rows.length === 0) return NextResponse.json({ message: "No items need i18n backfill", processed: 0 });
    let processed = 0;
    let errs = 0;
    const out: { id: string; status: string }[] = [];
    for (const it of rows) {
      const tr = await translateDiscoveryI18n(it.salon_script_de, it.products_needed as string[] | null);
      if (!tr) { out.push({ id: it.id, status: "translate_null" }); errs++; continue; }
      const { error: upErr } = await admin
        .from("discovery_items")
        .update({
          salon_script_de: tr.script.de || it.salon_script_de,
          salon_script_en: tr.script.en || null,
          salon_script_fr: tr.script.fr || null,
          salon_script_it: tr.script.it || null,
          products_de: tr.products.de.length ? tr.products.de : null,
          products_en: tr.products.en.length ? tr.products.en : (it.products_needed ?? null),
          products_fr: tr.products.fr.length ? tr.products.fr : null,
          products_it: tr.products.it.length ? tr.products.it : null,
        })
        .eq("id", it.id);
      if (upErr) { out.push({ id: it.id, status: `db_error: ${upErr.message}` }); errs++; }
      else { out.push({ id: it.id, status: "i18n_done" }); processed++; }
    }
    return NextResponse.json({ message: `i18n backfill: ${processed} done, ${errs} errors`, processed, errors: errs, results: out });
  }

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

      // Analyze with Gemini — inline for better error tracking.
      // TikTok CDN thumbnails are time-signed and expire, so re-fetching the raw URL 403s on older
      // items. Route TikTok items through the persisted thumb proxy (Storage-backed), which still
      // serves the bytes after the original URL is dead.
      const imageUrl = isTikTok
        ? `${req.nextUrl.origin}/api/discovery/thumb/${item.id}`
        : (item.image_url || item.tiktok_thumbnail_url);
      if (!imageUrl) {
        results.push({ id: item.id, style_name: null, status: "skipped_no_image" });
        continue;
      }

      // Test if image is fetchable
      // input-abuse-04 (2026-07-27): the isTikTok branch above is our own same-origin
      // proxy route (already SSRF-guarded at app/api/discovery/thumb/[id]/route.ts); the
      // non-TikTok branch is item.image_url/tiktok_thumbnail_url, a DB column populated by
      // the import pipeline, so guard it here before the fetch fires.
      let imageRes;
      try {
        // The same-origin proxy is allowed locally, but may never redirect elsewhere.
        imageRes = isTikTok
          ? await fetch(imageUrl, { signal: AbortSignal.timeout(10000), redirect: "error" })
          : await fetchSafeImage(imageUrl, { signal: AbortSignal.timeout(10000) });
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

      // Clamp the AI category to the allowed discovery set — Gemini occasionally returns an
      // off-list value (e.g. "skincare"), which would fail the category check constraint and
      // discard the whole (otherwise good) analysis. Fall back to the item's existing category.
      const ALLOWED_CATS = ["hair", "beard", "nails", "lashes", "brows"];
      const safeCategory = ALLOWED_CATS.includes(aiResult.category) ? aiResult.category : item.category;
      // Gemini can return off-list enum values for the other constrained columns too; clamp each to
      // its allowed set so one bad value doesn't discard the whole analysis (e.g. texture_check on a
      // lash "D-curl"). Fall back to the item's existing value when the AI value isn't allowed.
      const safeGender = ["male", "female", "unisex"].includes(aiResult.gender) ? aiResult.gender : item.gender;
      const safeTexture = aiResult.texture !== null && ["straight", "wavy", "curly", "coily"].includes(aiResult.texture) ? aiResult.texture : item.texture;
      const safeMaint = aiResult.maintenance_level !== null && ["low", "medium", "high"].includes(aiResult.maintenance_level) ? aiResult.maintenance_level : item.maintenance;

      const { error } = await admin
        .from("discovery_items")
        .update({
          content_type: correctContentType,
          category: safeCategory,
          gender: safeGender,
          texture: safeTexture,
          style_name: aiResult.style_name,
          tags: aiResult.tags?.length > 0 ? aiResult.tags : item.tags,
          maintenance: safeMaint,
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
          // Store the full rich AI analysis as JSONB (spread to satisfy the Json index signature)
          ai_analysis: { ...aiResult },
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
