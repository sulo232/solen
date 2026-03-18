import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json();
  const { salon_id, slots } = body;

  if (!salon_id || !Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ message: "salon_id and slots array required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // Verify salon ownership
  const { data: salon } = await supabase.from("salons").select("owner_id").eq("id", salon_id).single();
  if (!salon || salon.owner_id !== user.id) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  const toInsert = slots.map((slot: { service_id: string; staff_member_id?: string; starts_at: string; ends_at: string; status?: string }) => ({
    salon_id,
    service_id: slot.service_id,
    staff_member_id: slot.staff_member_id ?? null,
    starts_at: slot.starts_at,
    ends_at: slot.ends_at,
    status: slot.status ?? "available",
  }));

  const { data, error } = await supabase.from("availability_slots").insert(toInsert).select();
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
