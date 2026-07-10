export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, nailDiscoveryPublishSchema } from "@/lib/validations";
import { getActiveSalon } from "@/lib/active-salon";

// POST /api/nail-discovery/publish — Publish nail design to discovery feed
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(nailDiscoveryPublishSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { design_history_id } = validated;

  const admin = createAdminSupabaseClient();

  // Verify salon ownership
  const salon = await getActiveSalon<{ id: string; name: string; slug: string }>(admin, user.id, "id, name, slug");
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get design history record
  const { data: design } = await admin
    .from("nail_design_history")
    .select("*")
    .eq("id", design_history_id)
    .eq("salon_id", salon.id)
    .single();

  if (!design || !design.photo_url) {
    return NextResponse.json({ error: "Design not found or has no photo" }, { status: 404 });
  }

  // Create discovery item
  const tags: string[] = [];
  if (design.material) tags.push(design.material);
  if (design.style_category) tags.push(design.style_category);
  if (design.shape) tags.push(design.shape);

  const { data: item, error } = await admin
    .from("discovery_items")
    .insert({
      category: "nails",
      content_type: "salon",
      image_url: design.photo_url,
      name_de: design.style_category ? `${design.style_category} Nails` : "Nail Design",
      name_en: design.style_category ? `${design.style_category} Nails` : "Nail Design",
      tags,
      status: "published",
      owner_salon_id: salon.id,
      gender: "all",
      media_type: "photo",
      source: "salon",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item }, { status: 201 });
}
