export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, nailPortfolioTagsSchema } from "@/lib/validations";

// POST /api/staff/portfolio — Upload portfolio image with optional nail metadata
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { staff_member_id, image_url, caption, sort_order } = body;

  if (!staff_member_id || !image_url) {
    return NextResponse.json({ error: "staff_member_id and image_url required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Verify salon ownership
  const { data: staff } = await admin
    .from("staff_members").select("id, salon_id").eq("id", staff_member_id).single();
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const { data: salon } = await admin
    .from("salons").select("id, owner_id, categories").eq("id", staff.salon_id).single();
  if (!salon || salon.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build insert data
  const insertData: Record<string, unknown> = {
    staff_member_id,
    image_url,
    caption: caption || null,
    sort_order: sort_order ?? 0,
  };

  // Add nail metadata if salon is a nail salon
  if (salon.categories?.includes("nails")) {
    const disabled = await checkFeatureEnabled("nail_features");
    if (!disabled) {
      const { data: nailTags } = validateBody(nailPortfolioTagsSchema, body);
      if (nailTags) {
        insertData.nail_style = nailTags.nail_style || null;
        insertData.nail_shape = nailTags.nail_shape || null;
        insertData.nail_material = nailTags.nail_material || null;
        insertData.tags = nailTags.tags || [];
      }
    }
  }

  const { data: image, error } = await admin
    .from("staff_portfolio_images")
    .insert(insertData)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ image }, { status: 201 });
}
