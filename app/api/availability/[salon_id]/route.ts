import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/availability/[salon_id]
 * Available slots for a salon, grouped by date.
 * Query params: service_id, staff_member_id?, date_from, date_to
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ salon_id: string }> }
) {
  const { salon_id } = await params;
  const { searchParams } = new URL(request.url);
  const service_id      = searchParams.get("service_id");
  const staff_member_id = searchParams.get("staff_member_id");
  const date_from       = searchParams.get("date_from");
  const date_to         = searchParams.get("date_to");

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("availability_slots")
    .select("*, services(name_de, name_en, duration_minutes, price), staff_members(name, avatar_url)")
    .eq("salon_id", salon_id)
    .eq("status", "available")
    .order("starts_at", { ascending: true });

  if (service_id)      query = query.eq("service_id", service_id);
  if (staff_member_id) query = query.eq("staff_member_id", staff_member_id);
  if (date_from)       query = query.gte("starts_at", date_from);
  if (date_to)         query = query.lte("starts_at", date_to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  // Group slots by date
  const grouped: Record<string, typeof data> = {};
  for (const slot of data ?? []) {
    const date = slot.starts_at.split("T")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date]!.push(slot);
  }

  return NextResponse.json({ slots: grouped, total: data?.length ?? 0 });
}
