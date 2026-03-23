import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryPostLimiter } from "@/lib/ratelimit";
import { validateBody, discoveryPostSchema } from "@/lib/validations";
import { checkContentFlags } from "@/lib/content-flags";

export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(discoveryPostLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(discoveryPostSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // Check if user is a salon owner (for owner_salon_id)
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  let ownerSalonId: string | null = null;
  if (profile?.role === "salon_owner") {
    const { data: salon } = await supabase
      .from("salons").select("id").eq("owner_id", user.id).eq("is_active", true).single();
    ownerSalonId = salon?.id ?? null;
  }

  // Count today's posts for auto-flagging
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabase
    .from("discovery_items")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", user.id)
    .gte("created_at", `${today}T00:00:00Z`);

  // Auto-flag check
  const flags = checkContentFlags({
    text: data.description ?? data.style_name,
    tags: data.tags,
    gender: data.gender,
    dailyPostCount: count ?? 0,
  });

  const status = flags.flagged ? "flagged" : "published";

  const insertData: Record<string, unknown> = {
    category: data.category,
    content_type: "user_post",
    media_type: data.media_type,
    gender: data.gender,
    style_name: data.style_name,
    description: data.description,
    tags: data.tags,
    texture: data.texture,
    source: "user",
    status,
    flag_reason: flags.flagged ? flags.reasons.join(", ") : null,
    owner_user_id: user.id,
    owner_salon_id: ownerSalonId,
  };

  if (data.media_type === "video" && data.tiktok_url) {
    insertData.tiktok_url = data.tiktok_url;
    // Extract video ID for thumbnail
    const videoIdMatch = data.tiktok_url.match(/\/video\/(\d+)/);
    if (videoIdMatch) {
      insertData.source_id = videoIdMatch[1];
    }
  }

  const { data: item, error: insertError } = await supabase
    .from("discovery_items")
    .insert(insertData)
    .select("id, status")
    .single();

  if (insertError) {
    console.error("[discovery/post] Insert error:", insertError);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }

  return NextResponse.json({ item, flagged: flags.flagged });
}
