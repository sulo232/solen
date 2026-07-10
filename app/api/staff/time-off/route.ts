export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, staffTimeOffSchema } from "@/lib/validations";
import { getActiveSalon } from "@/lib/active-salon";

// GET /api/staff/time-off — Get time-off entries
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staffMemberId = new URL(req.url).searchParams.get("staff_member_id");

  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");

  const { data: selfStaff } = !salon
    ? await supabase.from("staff_members").select("id, salon_id").eq("user_id", user.id).single()
    : { data: null };

  const salonId = salon?.id ?? selfStaff?.salon_id;
  if (!salonId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let query = supabase.from("staff_time_off").select("*, staff_members(name)").eq("salon_id", salonId);
  if (staffMemberId) query = query.eq("staff_member_id", staffMemberId);

  const { data, error } = await query.order("start_date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}

// POST /api/staff/time-off — Create time-off entry
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(staffTimeOffSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { staff_member_id, start_date, end_date, reason } = validated;

  // Verify ownership
  const { data: staffMember } = await supabase
    .from("staff_members")
    .select("id, salon_id, salons(owner_id)")
    .eq("id", staff_member_id)
    .single();

  if (!staffMember) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const owner = (staffMember.salons as unknown as { owner_id: string })?.owner_id;
  // Allow salon owner OR the staff member themselves
  const isSelf = await supabase.from("staff_members").select("id").eq("id", staff_member_id).eq("user_id", user.id).single();
  if (owner !== user.id && !isSelf.data) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("staff_time_off")
    .insert({
      staff_member_id,
      salon_id: staffMember.salon_id,
      start_date,
      end_date,
      reason: reason ?? null,
      status: owner === user.id ? "approved" : "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

// DELETE /api/staff/time-off — Delete time-off by id
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const timeOffId = new URL(req.url).searchParams.get("id");
  if (!timeOffId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");

  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("staff_time_off")
    .delete()
    .eq("id", timeOffId)
    .eq("salon_id", salon.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Deleted" });
}
