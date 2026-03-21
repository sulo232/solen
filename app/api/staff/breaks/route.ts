export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/staff/breaks — Get breaks for a staff member
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staffMemberId = new URL(req.url).searchParams.get("staff_member_id");

  // User must be salon owner or the staff member
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  const { data: selfStaff } = !salon
    ? await supabase.from("staff_members").select("id, salon_id").eq("user_id", user.id).single()
    : { data: null };

  const salonId = salon?.id ?? selfStaff?.salon_id;
  if (!salonId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let query = supabase.from("staff_breaks").select("*").eq("salon_id", salonId);
  if (staffMemberId) query = query.eq("staff_member_id", staffMemberId);

  const { data, error } = await query.order("day_of_week").order("start_time");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}

// POST /api/staff/breaks — Create a break (salon owner only)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { staff_member_id, day_of_week, start_time, end_time } = body;

  if (!staff_member_id || day_of_week === undefined || !start_time || !end_time) {
    return NextResponse.json({ error: "staff_member_id, day_of_week, start_time, end_time required" }, { status: 400 });
  }

  // Verify salon ownership of this staff member
  const { data: staffMember } = await supabase
    .from("staff_members")
    .select("id, salon_id, salons(owner_id)")
    .eq("id", staff_member_id)
    .single();

  if (!staffMember) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  const owner = (staffMember.salons as unknown as { owner_id: string })?.owner_id;
  if (owner !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const breakId = new URL(req.url).searchParams.get("id");
  if (!breakId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("staff_breaks")
    .delete()
    .eq("id", breakId)
    .eq("salon_id", salon.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Deleted" });
}
