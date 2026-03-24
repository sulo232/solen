export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, offPeakSlotSchema, offPeakDeleteSchema } from "@/lib/validations";

/**
 * GET /api/off-peak?salon_id=...
 * Returns all off-peak rules for a salon (owner only).
 */
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { user } = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons")
    .select("id")
    .eq("id", salonId)
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "Not your salon" }, { status: 403 });

  const { data, error } = await admin
    .from("off_peak_slots")
    .select("*")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("day_of_week")
    .order("start_time");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}

/**
 * POST /api/off-peak
 * Create a new off-peak rule. Validates no overlapping hours for same day.
 */
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { user } = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: input, error: vErr } = validateBody(offPeakSlotSchema, body);
  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 });

  if (input.start_time >= input.end_time) {
    return NextResponse.json({ error: "start_time must be before end_time" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: salon } = await admin
    .from("salons")
    .select("id")
    .eq("id", input.salon_id)
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "Not your salon" }, { status: 403 });

  const { data: existing } = await admin
    .from("off_peak_slots")
    .select("id, start_time, end_time")
    .eq("salon_id", input.salon_id)
    .eq("day_of_week", input.day_of_week)
    .eq("is_active", true);

  const overlap = (existing ?? []).some(
    (r) => input.start_time < r.end_time && input.end_time > r.start_time
  );
  if (overlap) {
    return NextResponse.json({ error: "Overlapping off-peak rule exists for this day" }, { status: 409 });
  }

  const { data: created, error } = await admin
    .from("off_peak_slots")
    .insert({
      salon_id: input.salon_id,
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      end_time: input.end_time,
      discount_percent: input.discount_percent,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(created, { status: 201 });
}

/**
 * DELETE /api/off-peak
 * Soft-delete an off-peak rule (set is_active=false).
 */
export async function DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { user } = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: input, error: vErr } = validateBody(offPeakDeleteSchema, body);
  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 });

  const admin = createAdminSupabaseClient();

  const { data: rule } = await admin
    .from("off_peak_slots")
    .select("id, salon_id")
    .eq("id", input.id)
    .single();

  if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

  const { data: salon } = await admin
    .from("salons")
    .select("id")
    .eq("id", rule.salon_id)
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "Not your salon" }, { status: 403 });

  const { error } = await admin
    .from("off_peak_slots")
    .update({ is_active: false })
    .eq("id", input.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
