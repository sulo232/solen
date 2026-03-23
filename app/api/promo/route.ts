export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, createPromoSchema } from "@/lib/validations";

// GET: List promo codes for the current user's salon or admin
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    // Admin sees all codes
    const { data: codes } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    return NextResponse.json({ codes: codes ?? [] });
  }

  // Salon owner sees their salon's codes
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!salon) {
    return NextResponse.json({ error: "Kein Salon gefunden" }, { status: 403 });
  }

  const { data: codes } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ codes: codes ?? [] });
}

// POST: Create a new promo code
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(createPromoSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Salon owners must attach their salon_id
  if (profile?.role !== "admin") {
    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!salon) {
      return NextResponse.json({ error: "Kein Salon gefunden" }, { status: 403 });
    }

    // Force salon_id for non-admin
    data.salon_id = salon.id;
  }

  // Check for duplicate code
  const { data: existing } = await supabase
    .from("promo_codes")
    .select("id")
    .ilike("code", data.code)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Dieser Code existiert bereits" }, { status: 409 });
  }

  const { data: promo, error: insertError } = await supabase
    .from("promo_codes")
    .insert({
      ...data,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }

  return NextResponse.json({ promo }, { status: 201 });
}
