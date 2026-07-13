export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, adminSalonOfMonthSchema } from "@/lib/validations";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";

/**
 * GET: candidates to pick from (highest rating among active salons with 5+
 *      reviews), the CURRENT winner (if any), and the on/off toggle state,
 *      so the admin page can render the whole picker in one fetch.
 * POST: admin confirms a selection. Persists into salon_of_month_winners
 *      (20260713140000_salon_of_month.sql) , this used to only write a
 *      throwaway string into feature_flags.description that nothing ever
 *      read back out; now it's a real row the public reader queries.
 *
 * The on/off toggle itself lives on the EXISTING generic
 * /api/admin/feature-flags GET/PATCH route (key="salon_of_month",
 * seeded by the migration) , not duplicated here.
 */
export async function GET(req: NextRequest) {
  const authSupabase = await createServerSupabaseClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminSupabaseClient();

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // Get salon with highest average_rating among active salons with 5+ reviews
  const { data: candidates, error: candidatesError } = await supabase
    .from("salons")
    .select("id, name, slug, cover_photo_url, categories, average_rating, review_count, quartier")
    .eq("is_active", true)
    .gte("review_count", 5)
    .order("average_rating", { ascending: false })
    .limit(5);

  if (candidatesError) {
    console.error("[GET /api/admin/salon-of-month] failed to load candidates:", candidatesError);
    return NextResponse.json({ error: "Failed to load candidates" }, { status: 500 });
  }

  const { data: flag } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("key", "salon_of_month")
    .maybeSingle();

  const { data: currentWinner, error: currentWinnerError } = await supabase
    .from("salon_of_month_winners")
    .select("month, reason, salon_id, selected_at, salons(id, name, slug, cover_photo_url, average_rating, review_count, quartier)")
    .eq("is_current", true)
    .maybeSingle();

  if (currentWinnerError) {
    console.error("[GET /api/admin/salon-of-month] failed to load current winner:", currentWinnerError);
    return NextResponse.json({ error: "Failed to load current winner" }, { status: 500 });
  }

  return NextResponse.json({
    candidates: candidates ?? [],
    enabled: flag?.enabled ?? false,
    current: currentWinner ?? null,
  });
}

export async function POST(req: NextRequest) {
  const authSupabase = await createServerSupabaseClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify admin
  const supabase = createAdminSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminSalonOfMonthSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { salon_id, month, reason } = validated;

  // The salon has to be a real, active salon , don't let a stale/garbage
  // uuid become "the winner" and 404 on the homepage.
  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("id")
    .eq("id", salon_id)
    .eq("is_active", true)
    .maybeSingle();
  if (salonError) {
    console.error("[POST /api/admin/salon-of-month] failed to verify salon:", salonError);
    return NextResponse.json({ error: "Failed to verify salon" }, { status: 500 });
  }
  if (!salon) {
    return NextResponse.json({ error: "Salon not found or inactive" }, { status: 404 });
  }

  // Flip the previous current winner off first, then insert the new one.
  // Not a real DB transaction (supabase-js has no cross-statement transaction
  // here), but the table's partial unique index on is_current=true is the
  // backstop: a race can only ever fail loudly (insert conflict), never
  // silently leave two "current" rows.
  const { error: clearError } = await supabase
    .from("salon_of_month_winners")
    .update({ is_current: false })
    .eq("is_current", true);
  if (clearError) {
    console.error("[POST /api/admin/salon-of-month] failed to clear previous winner:", clearError);
    return NextResponse.json({ error: "Failed to update winner" }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("salon_of_month_winners")
    .insert({
      salon_id,
      month,
      reason: reason ?? null,
      is_current: true,
      selected_by: user.id,
    })
    .select("month, reason, salon_id, selected_at")
    .single();

  if (insertError) {
    console.error("[POST /api/admin/salon-of-month] failed to insert winner:", insertError);
    return NextResponse.json({ error: "Failed to save winner" }, { status: 500 });
  }

  await logAuditEvent(req, user.id, "salon_of_month.select", "salon", salon_id, { month, reason });

  return NextResponse.json({ success: true, winner: inserted });
}
