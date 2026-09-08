export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, createPromoSchema } from "@/lib/validations";
import { getActiveSalon } from "@/lib/active-salon";

// GET: List promo codes for the current user's salon or admin
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    // Admin sees all codes. Explicit column list (not `select("*")`) per the
    // sensitive-table select gate, same columns as the salon-scoped branch below.
    const { data: codes } = await supabase
      .from("promo_codes")
      .select("id, code, discount_type, discount_value, min_booking_amount, max_uses, current_uses, per_user_limit, salon_id, valid_from, valid_until, is_active, created_by, created_at")
      .order("created_at", { ascending: false });
    return NextResponse.json({ codes: codes ?? [] });
  }

  // Salon owner sees their salon's codes
  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id", "marketing");

  if (!salon) {
    return NextResponse.json({ error: "Kein Salon gefunden" }, { status: 403 });
  }

  // P9-2 (2026-09-05): promo_codes_public_read only shows is_active = true
  // rows and there is no owner/staff SELECT policy at all, so a staff member
  // granted "marketing" above would still read a partial list (any of the
  // salon's inactive/expired codes missing) through the session client.
  // Admin client, scoped to the same gated salon.id, for the full list.
  // Explicit column list (not `select("*")`) per the sensitive-table select
  // gate: these are exactly the columns promo_codes carries.
  const admin = createAdminSupabaseClient();
  const { data: codes } = await admin
    .from("promo_codes")
    .select("id, code, discount_type, discount_value, min_booking_amount, max_uses, current_uses, per_user_limit, salon_id, valid_from, valid_until, is_active, created_by, created_at")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ codes: codes ?? [] });
}

// POST: Create a new promo code
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id", "marketing");

    if (!salon) {
      return NextResponse.json({ error: "Kein Salon gefunden" }, { status: 403 });
    }

    // Force salon_id for non-admin
    data.salon_id = salon.id;
  }

  // P9-2 (2026-09-05): promo_codes_salon_owner_insert requires the salon's
  // owner_id, not just any active staff row, so a staff member granted
  // "marketing" above would fail this INSERT's RLS check outright (and the
  // duplicate-code lookup below would silently miss any inactive code, since
  // promo_codes_public_read only shows is_active = true rows). Admin client
  // for both, same as the GET handler above; `data.salon_id` is already
  // forced to the gated salon.id for non-admin callers, never body-supplied.
  const admin = createAdminSupabaseClient();

  // Check for duplicate code
  const { data: existing } = await admin
    .from("promo_codes")
    .select("id")
    .eq("code", data.code.toUpperCase())
    .single();

  if (existing) {
    return NextResponse.json({ error: "Dieser Code existiert bereits" }, { status: 409 });
  }

  const { data: promo, error: insertError } = await admin
    .from("promo_codes")
    .insert({
      ...data,
      created_by: user.id,
    })
    .select("id, code, discount_type, discount_value, min_booking_amount, max_uses, current_uses, per_user_limit, salon_id, valid_from, valid_until, is_active, created_by, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }

  return NextResponse.json({ promo }, { status: 201 });
}
