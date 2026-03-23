import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryAdminLimiter } from "@/lib/ratelimit";
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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const category = formData.get("category") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max 5MB" }, { status: 400 });

  try {
    const sharp = (await import("sharp")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const webp = await sharp(buffer).webp({ quality: 85 }).toBuffer();
    const fileName = `admin/${crypto.randomUUID()}.webp`;

    const admin = createAdminSupabaseClient();
    const { error: uploadError } = await admin.storage.from("discovery-images").upload(fileName, webp, {
      contentType: "image/webp",
    });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: publicUrl } = admin.storage.from("discovery-images").getPublicUrl(fileName);

    // Insert directly as published
    const { data: item, error: insertError } = await admin.from("discovery_items").insert({
      category: category ?? "hair",
      content_type: "curated",
      image_url: publicUrl.publicUrl,
      media_type: "photo",
      source: "admin",
      source_id: fileName,
      status: "published",
      is_active: true,
    }).select("id").single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    await logAuditEvent(req, user.id, "discovery.publish", "upload", item?.id, { category });

    return NextResponse.json({ id: item?.id, image_url: publicUrl.publicUrl });
  } catch (err) {
    console.error("[discovery/upload] Error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
