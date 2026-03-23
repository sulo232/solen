import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryAdminLimiter } from "@/lib/ratelimit";
import { analyzeDiscoveryImage } from "@/lib/ai-vision";
import { validateBody, adminDiscoveryAnalyzeSchema } from "@/lib/validations";

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
  const { data: validated, error: validationError } = validateBody(adminDiscoveryAnalyzeSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { item_id, image_url } = validated;

  const result = await analyzeDiscoveryImage(image_url);
  if (!result) return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });

  // Update staging item with AI results
  const admin = createAdminSupabaseClient();
  await admin.from("discovery_staging").update({
    auto_category: result.category,
    auto_gender: result.gender,
    auto_texture: result.texture,
    auto_style: result.style_name,
    auto_tags: result.tags,
    ai_description: result.description_en,
    category: result.category,
  }).eq("id", item_id);

  return NextResponse.json({ analysis: result });
}
