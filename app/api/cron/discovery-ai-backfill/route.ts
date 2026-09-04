// exists-check: net-new vs app/api/admin/discovery/backfill (that one is ADMIN-gated, on-demand, hair-only). This
// is the AUTOMATIC future-proof path (owner 2026-06-23): a CRON that finds any published look missing a description
// and runs the category-aware AI on it (nails->nail specs, lashes->lash specs, etc). Imports stay instant; every new
// look gets its real description within the cron window, forever, at any volume. Bounded per run so it never times out.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { analyzeDiscoveryImage, analyzeDiscoveryTikTok } from "@/lib/ai-vision";
import { withCronRun } from "@/lib/cron-run";
import { verifyCronSecret } from "@/lib/cron-auth";

const PER_RUN = 10; // bounded: 10 looks x ~10s AI ~= under the function limit

export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  if (!(await verifyCronSecret(req.headers.get("authorization"), cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!getServerEnv().GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 503 });

  return withCronRun("discovery-ai-backfill", async () => {
  const admin = createAdminSupabaseClient();
  // Oldest un-described, active, published looks that actually have an image to analyze.
  const { data: items, error } = await admin
    .from("discovery_items")
    .select("id, category, image_url, tiktok_url, tiktok_thumbnail_url, alt_text, media_type, content_type, style_name")
    .is("description_en", null)
    .eq("is_active", true)
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .limit(PER_RUN);
  if (error) return { error: error.message, errors: [error.message] };

  let analyzed = 0, failed = 0;
  const errors: string[] = [];
  for (const it of items ?? []) {
    const imageUrl = (it.image_url as string) || (it.tiktok_thumbnail_url as string);
    if (!imageUrl) { failed++; errors.push(`item ${it.id}: no image_url/tiktok_thumbnail_url to analyze`); continue; }
    try {
      const isTikTok = !!it.tiktok_url || it.media_type === "tiktok";
      const ai = isTikTok
        ? await analyzeDiscoveryTikTok(imageUrl, (it.alt_text as string) ?? "", (it.tiktok_url as string) ?? undefined, it.category as string)
        : await analyzeDiscoveryImage(imageUrl, it.category as string);
      if (!ai) { failed++; errors.push(`item ${it.id}: AI analysis returned no result`); continue; }
      const productsFlat = ai.products_flat ?? (Array.isArray(ai.products_needed) ? ai.products_needed : []);
      // Keep existing category + texture (they carry CHECK constraints; the AI override sets texture=null for
      // nails/lashes anyway). Everything else comes from the category-aware AI output.
      const { error: upErr } = await admin.from("discovery_items").update({
        content_type: isTikTok ? "tiktok" : (it.content_type as string),
        style_name: ai.style_name ?? (it.style_name as string),
        gender: ai.gender ?? null,
        tags: ai.tags?.length ? ai.tags : undefined,
        maintenance: ai.maintenance_level ?? null,
        face_shapes: ai.face_shapes ?? [],
        products_needed: productsFlat,
        hair_type_match: ai.hair_type_match ?? [],
        description_en: ai.description_en, description_de: ai.description_de,
        description_fr: ai.description_fr, description_it: ai.description_it,
        salon_script_de: ai.salon_script_de, cut_guide: ai.cut_guide,
        price_min: ai.price_min ?? null, price_max: ai.price_max ?? null,
        ai_analysis: { ...ai },
      }).eq("id", it.id);
      if (upErr) {
        console.error("[cron/discovery-ai-backfill] update failed:", it.id, upErr.message);
        failed++;
        errors.push(`item ${it.id}: ${upErr.message}`);
        continue;
      }
      analyzed++;
    } catch (e) {
      console.error("[cron/discovery-ai-backfill] analyze failed:", it.id, String(e));
      failed++;
      errors.push(`item ${it.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { analyzed, failed, picked: items?.length ?? 0, processed: analyzed, errors };
  });
}
