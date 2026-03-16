import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/slots?salon_id=&date=&service_id=&staff_member_id=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salon_id = searchParams.get("salon_id");
  const date = searchParams.get("date"); // YYYY-MM-DD
  const service_id = searchParams.get("service_id");
  const staff_member_id = searchParams.get("staff_member_id");

  if (!salon_id || !date) {
    return NextResponse.json(
      { message: "salon_id and date are required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // Build time range for the given date
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  let query = supabase
    .from("availability_slots")
    .select("*, services(id, name_de, name_en, duration_minutes, price), staff_members(id, name, avatar_url)")
    .eq("salon_id", salon_id)
    .gte("starts_at", startOfDay)
    .lte("starts_at", endOfDay)
    .order("starts_at", { ascending: true });

  if (service_id) query = query.eq("service_id", service_id);
  if (staff_member_id) query = query.eq("staff_member_id", staff_member_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ items: data ?? [], total: data?.length ?? 0 });
}
