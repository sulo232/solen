import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { validateBody, discoveryTikTokImportSchema } from "@/lib/validations";
import { analyzeDiscoveryTikTok } from "@/lib/ai-vision";

/**
 * POST /api/admin/discovery/import-tiktok
 * Import TikTok videos by URL. For each URL:
 *   1. Fetch oEmbed data (thumbnail, author, title)
 *   2. Insert into discovery_items
 *   3. Trigger AI analysis
 */
export async function POST(req: NextRequest) {
  // 1. Feature flag
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  // 2. Auth
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 3. Ban check
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // 4. Admin role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 5. Rate limit
  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 6. Input validation (Zod)
  const body = await req.json().catch(() => null);
  const { data: validated, error: validationError } = validateBody(discoveryTikTokImportSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  const urls: string[] = validated.urls.filter((u) => u.includes("tiktok.com"));
  if (!urls.length) return NextResponse.json({ error: "No valid TikTok URLs provided" }, { status: 400 });
  const defaultCategory = validated.category ?? "hair";

  const admin = createAdminSupabaseClient();
  const results: Array<{ url: string; status: string; id?: string; style_name?: string }> = [];

  for (const url of urls.slice(0, 20)) { // Max 20 per request
    try {
      // 1. Fetch oEmbed data
      const oembedRes = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!oembedRes.ok) {
        results.push({ url, status: "oembed_failed" });
        continue;
      }
      const oembed = await oembedRes.json();

      // 2. Extract video ID
      const videoIdMatch = url.match(/\/video\/(\d+)/);
      const videoId = videoIdMatch?.[1] ?? "";

      // 3. Insert into discovery_items
      const itemId = crypto.randomUUID();
      const { error: insertError } = await admin.from("discovery_items").insert({
        id: itemId,
        tiktok_url: url,
        tiktok_thumbnail_url: oembed.thumbnail_url ?? null,
        tiktok_embed_html: oembed.html ?? null,
        media_type: "tiktok",
        content_type: "inspo",
        category: defaultCategory,
        author_name: oembed.author_name ?? null,
        alt_text: oembed.title ?? null,
        image_url: oembed.thumbnail_url ?? null,
        status: "published",
        is_active: true,
        uploaded_by: user.id,
      });

      if (insertError) {
        // Might be a duplicate
        if (insertError.message?.includes("duplicate")) {
          results.push({ url, status: "already_exists" });
        } else {
          results.push({ url, status: `insert_error: ${insertError.message}` });
        }
        continue;
      }

      // 4. Trigger AI analysis (best-effort, don't block)
      let styleName: string | null = null;
      try {
        const aiResult = await analyzeDiscoveryTikTok(
          oembed.thumbnail_url ?? "",
          oembed.title ?? "",
          url
        );
        if (aiResult) {
          styleName = aiResult.style_name ?? null;
          const freshThumb = (aiResult as any)._freshThumbnailUrl;

          // products_needed is now an object (texture-adaptive), use products_flat for DB
          const productsFlat = aiResult.products_flat
            ?? (Array.isArray(aiResult.products_needed) ? aiResult.products_needed : []);

          await admin.from("discovery_items").update({
            category: aiResult.category ?? "hair",
            gender: aiResult.gender ?? "unisex",
            texture: aiResult.texture,
            style_name: aiResult.style_name,
            tags: aiResult.tags,
            maintenance: aiResult.maintenance_level,
            face_shapes: aiResult.face_shapes,
            products_needed: productsFlat,
            hair_type_match: aiResult.hair_type_match,
            description_en: aiResult.description_en,
            description_de: aiResult.description_de,
            description_fr: aiResult.description_fr,
            description_it: aiResult.description_it,
            salon_script_de: aiResult.salon_script_de,
            cut_guide: aiResult.cut_guide,
            price_min: aiResult.price_min,
            price_max: aiResult.price_max,
            // Store the full rich AI analysis as JSONB
            ai_analysis: aiResult,
            ...(freshThumb ? { tiktok_thumbnail_url: freshThumb, image_url: freshThumb } : {}),
          }).eq("id", itemId);
        }
      } catch (aiErr) {
        console.error("[import-tiktok] AI analysis failed for", url, aiErr);
      }

      results.push({ url, status: "imported", id: itemId, style_name: styleName ?? undefined });
    } catch (err) {
      results.push({ url, status: `error: ${String(err)}` });
    }
  }

  const published = results.filter((r) => r.status === "imported").length;
  const failed = results.filter((r) => r.status.startsWith("error") || r.status.startsWith("insert_error") || r.status === "oembed_failed").length;
  const rejected = results.filter((r) => r.status === "already_exists").length;
  const pending = results.length - published - failed - rejected;
  return NextResponse.json({ published, rejected, pending, failed, total: results.length, results });
}
