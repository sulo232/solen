export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ salon_id: string }> }
) {
  const { salon_id } = await params;
  const { searchParams } = new URL(request.url);
  const service_id = searchParams.get("service_id");
  const staff_member_id = searchParams.get("staff_member_id");
  const date_from = searchParams.get("date_from") ?? new Date().toISOString();
  const date_to = searchParams.get("date_to") ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("availability_slots")
    .select("*, services(name_de, name_en, duration_minutes, price), staff_members(name, avatar_url)")
    .eq("salon_id", salon_id)
    .eq("status", "available")
    .gte("starts_at", date_from)
    .lte("starts_at", date_to)
    .order("starts_at", { ascending: true });

  if (service_id) query = query.eq("service_id", service_id);
  if (staff_member_id) query = query.eq("staff_member_id", staff_member_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Group by date
  const grouped: Record<string, typeof data> = {};
  for (const slot of data ?? []) {
    const date = slot.starts_at.split("T")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(slot);
  }

  // Compute fully booked dates for the month (dates with 0 available slots)
  // Query ALL slots (any status) in the range, then find dates where none are 'available'
  const { data: allSlots } = await supabase
    .from("availability_slots")
    .select("starts_at, status")
    .eq("salon_id", salon_id)
    .gte("starts_at", date_from)
    .lte("starts_at", date_to);

  const dateHasAvailable = new Set<string>();
  const allDatesWithSlots = new Set<string>();
  for (const slot of allSlots ?? []) {
    const d = slot.starts_at.split("T")[0];
    allDatesWithSlots.add(d);
    if (slot.status === "available") dateHasAvailable.add(d);
  }
  const fully_booked_dates = [...allDatesWithSlots].filter(d => !dateHasAvailable.has(d));

  return NextResponse.json({ data: grouped, fully_booked_dates });
}
