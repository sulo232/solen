import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryAdminLimiter } from "@/lib/ratelimit";
import { validateBody, discoveryStagingSchema } from "@/lib/validations";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const category = req.nextUrl.searchParams.get("category");

  let query = admin.from("discovery_staging").select("*").eq("status", status).order("created_at", { ascending: false }).limit(100);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data });
}

export async function PUT(req: NextRequest) {
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
  const { data, error } = validateBody(discoveryStagingSchema, body);
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });

  const admin = createAdminSupabaseClient();

  if (data.action === "reject") {
    await admin.from("discovery_staging").update({
      status: "rejected",
      rejected_reason: data.reject_reason ?? null,
      approved_by: user.id,
    }).in("id", data.ids);

    await logAuditEvent(req, user.id, "discovery.reject", "staging", undefined, { ids: data.ids });
    return NextResponse.json({ rejected: data.ids.length });
  }

  // Approve: move from staging to discovery_items
  const { data: stagingItems } = await admin.from("discovery_staging").select("*").in("id", data.ids);
  if (!stagingItems || stagingItems.length === 0) {
    return NextResponse.json({ error: "No items found" }, { status: 404 });
  }

  let approved = 0;
  for (const item of stagingItems) {
    // Branch by media_type
    let imageUrl = item.image_url;

    if (item.media_type === "photo" && item.image_url) {
      // Download and convert to WebP, upload to Supabase Storage
      try {
        const sharp = (await import("sharp")).default;
        const imgRes = await fetch(item.image_url);
        const buffer = await imgRes.arrayBuffer();
        const webp = await sharp(Buffer.from(buffer)).webp({ quality: 85 }).toBuffer();
        const fileName = `curated/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await admin.storage.from("discovery-images").upload(fileName, webp, {
          contentType: "image/webp",
        });
        if (!uploadError) {
          const { data: publicUrl } = admin.storage.from("discovery-images").getPublicUrl(fileName);
          imageUrl = publicUrl.publicUrl;
        }
      } catch (err) {
        console.error("[staging] WebP conversion failed, using original URL:", err);
      }
    }
    // TikTok: no image download needed, copy metadata directly

    const { error: insertError } = await admin.from("discovery_items").insert({
      category: item.category ?? item.auto_category ?? "hair",
      content_type: "curated",
      image_url: item.media_type === "photo" ? imageUrl : item.thumbnail_url,
      tiktok_url: item.tiktok_url,
      tiktok_embed_html: item.tiktok_embed_html,
      tiktok_thumbnail_url: item.thumbnail_url,
      media_type: item.media_type,
      source: item.source,
      source_id: item.source_id,
      source_url: item.source_url,
      author_name: item.author_name,
      author_url: item.author_url,
      alt_text: item.alt_text,
      gender: item.auto_gender ?? "unisex",
      texture: item.auto_texture,
      style_name: item.auto_style,
      tags: [...(item.auto_tags ?? []), ...(item.api_tags ?? [])],
      description_en: item.ai_description,
      status: "published",
      is_active: true,
    });

    if (!insertError) {
      approved++;
      await admin.from("discovery_staging").update({
        status: "approved", approved_by: user.id,
      }).eq("id", item.id);
    }
  }

  await logAuditEvent(req, user.id, "discovery.publish", "staging", undefined, { approved, ids: data.ids });
  return NextResponse.json({ approved });
}
