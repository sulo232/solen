import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/availability/manage
 * Salon owner creates or blocks slots.
 * Body: { salon_id, slots: [{ service_id, staff_member_id?, starts_at, ends_at, status? }] }
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const { salon_id, slots } = body;

  if (!salon_id || !Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ message: "salon_id and slots[] are required", code: "BAD_REQUEST" }, { status: 400 });
  }

  // Verify salon ownership
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("id", salon_id)
    .eq("owner_id", user.id)
    .single();

  if (!salon) {
    return NextResponse.json({ message: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const rows = slots.map((s: {
    service_id: string;
    staff_member_id?: string;
    starts_at: string;
    ends_at: string;
    status?: string;
  }) => ({
    salon_id,
    service_id:      s.service_id,
    staff_member_id: s.staff_member_id ?? null,
    starts_at:       s.starts_at,
    ends_at:         s.ends_at,
    status:          s.status ?? "available",
  }));

  const { data, error } = await supabase
    .from("availability_slots")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ created: data, count: data?.length ?? 0 }, { status: 201 });
}
