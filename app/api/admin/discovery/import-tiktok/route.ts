import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryAdminLimiter } from "@/lib/ratelimit";
import { validateBody, discoveryTikTokImportSchema } from "@/lib/validations";
import { batchFetchTikTokEmbeds, isValidTikTokUrl } from "@/lib/tiktok-embed";
import { analyzeDiscoveryTikTok } from "@/lib/ai-vision";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(discoveryAdminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(discoveryTikTokImportSchema, body);
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });

  // Validate all URLs
  const validUrls = data.urls.filter(isValidTikTokUrl);
  if (validUrls.length === 0) {
    return NextResponse.json({ error: "No valid TikTok URLs provided" }, { status: 400 });
  }

  // Batch fetch oEmbed data
  const embedResults = await batchFetchTikTokEmbeds(validUrls);
  const admin = createAdminSupabaseClient();
  const batchId = crypto.randomUUID();
  const imported: string[] = [];
  const failed: string[] = [];

  for (const [url, embed] of embedResults.entries()) {
    if (!embed) {
      failed.push(url);
      continue;
    }

    // AI analysis from thumbnail
    const aiResult = await analyzeDiscoveryTikTok(embed.thumbnail_url, embed.title);

    const { error: insertError } = await admin.from("discovery_staging").upsert({
      source: "tiktok",
      source_id: url,
      source_url: url,
      tiktok_url: url,
      tiktok_embed_html: embed.html,
      image_url: embed.thumbnail_url || null,
      thumbnail_url: embed.thumbnail_url || null,
      media_type: "tiktok",
      author_name: embed.author_name,
      alt_text: embed.title,
      category: aiResult?.category ?? data.category ?? null,
      auto_category: aiResult?.category ?? null,
      auto_gender: aiResult?.gender ?? null,
      auto_texture: aiResult?.texture ?? null,
      auto_style: aiResult?.style_name ?? null,
      auto_tags: aiResult?.tags ?? [],
      ai_description: aiResult?.description_en ?? null,
      batch_id: batchId,
    }, { onConflict: "source,source_id" });

    if (insertError) {
      failed.push(url);
    } else {
      imported.push(url);
    }
  }

  await logAuditEvent(req, user.id, "discovery.import", "tiktok", undefined, {
    imported: imported.length, failed: failed.length, batch_id: batchId,
  });

  return NextResponse.json({ imported: imported.length, failed: failed.length, batch_id: batchId });
}
