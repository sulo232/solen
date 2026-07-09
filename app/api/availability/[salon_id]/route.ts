export const dynamic = "force-dynamic";
export const runtime = "edge";
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

  // Fetch all statuses in one scan so we can compute fully_booked_dates without a second query.
  // Explicit column list replaces select * to avoid sending unused slot columns over the wire.
  let query = supabase
    .from("availability_slots")
    .select(
      "id, starts_at, ends_at, service_id, staff_member_id, status, price_override, services(name_de, name_en, duration_minutes, price), staff_members(name, avatar_url)"
    )
    .eq("salon_id", salon_id)
    .gte("starts_at", date_from)
    .lte("starts_at", date_to)
    .order("starts_at", { ascending: true });

  if (service_id) query = query.eq("service_id", service_id);
  if (staff_member_id) query = query.eq("staff_member_id", staff_member_id);

  const { data: allSlots, error } = await query;
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Group available slots by date. starts_at is a true UTC instant; bucket by the
  // Europe/Zurich calendar day (not a raw UTC string slice) so this agrees with
  // /api/availability/unavailable-dates, which already buckets in Zurich, a slot at
  // e.g. 22:30 UTC is 00:30 the next Zurich day and must land in that next day's bucket.
  const zurichDateFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const toZurichDate = (isoInstant: string) => zurichDateFmt.format(new Date(isoInstant));

  // Group available slots by date; simultaneously track all dates and available dates.
  const grouped: Record<string, typeof allSlots> = {};
  const dateHasAvailable = new Set<string>();
  const allDatesWithSlots = new Set<string>();
  for (const slot of allSlots ?? []) {
    const d = toZurichDate(slot.starts_at);
    allDatesWithSlots.add(d);
    if (slot.status === "available") {
      dateHasAvailable.add(d);
      if (!grouped[d]) grouped[d] = [];
      grouped[d]!.push(slot);
    }
  }
  const fully_booked_dates = [...allDatesWithSlots].filter(d => !dateHasAvailable.has(d));

  return NextResponse.json({ data: grouped, fully_booked_dates });
}
