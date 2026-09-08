export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody, staffBreakSchema } from "@/lib/validations";
import { getActiveSalon, getActiveSalonId } from "@/lib/active-salon";
import { requireSalonAccess } from "@/lib/auth/require";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET /api/staff/breaks — Get breaks for a staff member
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staffMemberId = new URL(req.url).searchParams.get("staff_member_id");

  // User must be salon owner or the staff member
  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id", "schedule");

  const selfSalonId = !salon ? await getActiveSalonId(supabase, user.id, "any") : null;
  const { data: selfStaff } = selfSalonId
    ? await supabase.from("staff_members").select("id, salon_id")
        .eq("user_id", user.id).eq("salon_id", selfSalonId).eq("is_active", true).maybeSingle()
    : { data: null };

  const salonId = salon?.id ?? selfStaff?.salon_id;
  if (!salonId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!salon && staffMemberId && staffMemberId !== selfStaff?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resource read via the admin client, scoped by salonId resolved above:
  // breaks_owner_manage RLS on staff_breaks is owner-only, so both the
  // own-schedule fallback and a "schedule"-granted staff caller would see an
  // empty list through the session-scoped client.
  const admin = createAdminSupabaseClient();
  let query = admin.from("staff_breaks").select("*").eq("salon_id", salonId);
  if (!salon) query = query.eq("staff_member_id", selfStaff!.id);
  else if (staffMemberId) query = query.eq("staff_member_id", staffMemberId);

  const { data, error } = await query.order("day_of_week").order("start_time");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}

// POST /api/staff/breaks — Create a break (salon owner only)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(staffBreakSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { staff_member_id, day_of_week, start_time, end_time } = validated;

  // Verify salon ownership of this staff member
  const { data: staffMember } = await supabase
    .from("staff_members")
    .select("id, salon_id, salons(owner_id)")
    .eq("id", staff_member_id)
    .single();

  if (!staffMember) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (schedule = edit rota / staff working hours)
  // instead of the old owner-only compare.
  const access = await requireSalonAccess(staffMember.salon_id, "schedule");
  if (access instanceof NextResponse) return access;

  // Resource write via the admin client: breaks_owner_manage RLS on
  // staff_breaks is owner-only, so a "schedule"-granted staff caller would 500
  // through the session client. salon_id comes from staffMember, already
  // verified above to be the gated salon.
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("staff_breaks")
    .insert({ staff_member_id, salon_id: staffMember.salon_id, day_of_week, start_time, end_time })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

// DELETE /api/staff/breaks — Delete a break by id
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const breakId = new URL(req.url).searchParams.get("id");
  if (!breakId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id", "schedule");

  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Resource write via the admin client, still scoped by the gated salon.id:
  // breaks_owner_manage RLS is owner-only, so a "schedule"-granted staff
  // caller's delete would report success while removing nothing through the
  // session client. The row's own salon_id column (set at insert time from
  // the staff member's salon) is what `.eq("salon_id", salon.id)` checks, so
  // the admin client can only ever reach this gated salon's own rows.
  const admin = createAdminSupabaseClient();
  const { data: deleted, error } = await admin
    .from("staff_breaks")
    .delete()
    .eq("id", breakId)
    .eq("salon_id", salon.id)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // A wrong id, or one that belongs to a different salon, matches zero rows;
  // .delete() reports success either way, so a real row count is the only
  // way to tell "removed" from "nothing matched".
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Deleted" });
}
