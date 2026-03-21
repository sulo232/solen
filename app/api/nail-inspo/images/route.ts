export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, nailInspoSchema } from "@/lib/validations";

// GET /api/nail-inspo/images?board_id=xxx — List inspo images
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const url = new URL(req.url);
  const boardId = url.searchParams.get("board_id");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("nail_inspo_images")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (boardId) query = query.eq("board_id", boardId);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ images: data ?? [], total: count ?? 0, page, limit });
}

// POST /api/nail-inspo/images — Upload inspo image
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(nailInspoSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  if (!body.image_url) return NextResponse.json({ error: "image_url required" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: image, error } = await admin
    .from("nail_inspo_images")
    .insert({
      user_id: user.id,
      image_url: body.image_url,
      ...validated,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ image }, { status: 201 });
}

// DELETE /api/nail-inspo/images?id=xxx — Remove own inspo image
export async function DELETE(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const imageId = new URL(req.url).searchParams.get("id");
  if (!imageId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("nail_inspo_images")
    .delete()
    .eq("id", imageId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
