import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";

// GET /api/profile/favorites — list user's favorite salons
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data, error } = await supabase
    .from("favorites")
    .select("salon_id, created_at, salons(id, name, slug, cover_photo_url, quartier, average_rating, review_count, categories)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ favorites: data ?? [] });
}

// POST /api/profile/favorites — add a salon to favorites
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const salonId = body?.salon_id;
  if (!salonId || typeof salonId !== "string") {
    return NextResponse.json({ error: "salon_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, salon_id: salonId });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already in favorites" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Added to favorites" }, { status: 201 });
}

// DELETE /api/profile/favorites — remove a salon from favorites
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) {
    return NextResponse.json({ error: "salon_id query param is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("salon_id", salonId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Removed from favorites" });
}
