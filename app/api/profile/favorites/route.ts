export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, favoriteToggleSchema } from "@/lib/validations";

// GET /api/profile/favorites — list user's favorite salons
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // Try joined query first, fall back to simple query if join fails (e.g. missing FK)
  const { data, error } = await supabase
    .from("favorites")
    .select("salon_id, created_at, salons(id, name, slug, cover_photo_url, quartier, average_rating, review_count, categories)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/profile/favorites GET] join query failed:", error.message);
    // Fallback: return just the salon_ids without joined data
    const { data: simple, error: simpleError } = await supabase
      .from("favorites")
      .select("salon_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (simpleError) return NextResponse.json({ error: simpleError.message }, { status: 500 });
    return NextResponse.json({ favorites: simple ?? [] });
  }

  return NextResponse.json({ favorites: data ?? [] });
}

// POST /api/profile/favorites — add a salon to favorites
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
  const { data: validated, error: validationError } = validateBody(favoriteToggleSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const salonId = validated.salon_id;

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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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
