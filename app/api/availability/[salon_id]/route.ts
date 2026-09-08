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
  // Ring 2b: dropped the services(...)/staff_members(...) embeds, which repeated the
  // same joined fields on every one of the up to ~1,000 slot rows (the busiest salon
  // measured 458,447 bytes for 957 slots). The salon only has a handful of distinct
  // services/staff, so those are fetched ONCE each below and returned as top-level
  // lookup maps; slot rows keep only the ids (service_id, staff_member_id) needed to
  // look them up client-side.
  let query = supabase
    .from("availability_slots")
    .select("id, starts_at, ends_at, service_id, staff_member_id, status, price_override")
    .eq("salon_id", salon_id)
    .gte("starts_at", date_from)
    .lte("starts_at", date_to)
    .order("starts_at", { ascending: true });

  if (service_id) query = query.eq("service_id", service_id);
  if (staff_member_id) query = query.eq("staff_member_id", staff_member_id);

  const [{ data: allSlots, error }, { data: salonServices, error: servicesError }, { data: salonStaff, error: staffError }] =
    await Promise.all([
      query,
      supabase
        .from("services")
        .select("id, name_de, name_en, name_fr, name_it, duration_minutes, price")
        .eq("salon_id", salon_id),
      supabase
        .from("staff_members")
        .select("id, name, avatar_url")
        .eq("salon_id", salon_id),
    ]);
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  if (servicesError) console.error("[api/availability/[salon_id]] services lookup failed:", servicesError.message);
  if (staffError) console.error("[api/availability/[salon_id]] staff lookup failed:", staffError.message);

  const services: Record<string, { name_de: string | null; name_en: string | null; name_fr: string | null; name_it: string | null; duration_minutes: number | null; price: number | null }> = {};
  for (const s of salonServices ?? []) services[s.id] = { name_de: s.name_de, name_en: s.name_en, name_fr: s.name_fr, name_it: s.name_it, duration_minutes: s.duration_minutes, price: s.price };

  const staff: Record<string, { name: string | null; avatar_url: string | null }> = {};
  for (const m of salonStaff ?? []) staff[m.id] = { name: m.name, avatar_url: m.avatar_url };

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

  return NextResponse.json({ data: grouped, fully_booked_dates, services, staff });
}
