export const dynamic = "force-dynamic";
export const runtime = "edge";
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

  // Apply off-peak discounts to matching slots
  const slots = data ?? [];
  if (slots.length > 0) {
    const slotDate = new Date(date + "T00:00:00");
    const dayOfWeek = slotDate.getDay();

    const { data: offPeakRules } = await supabase
      .from("off_peak_slots")
      .select("start_time, end_time, discount_percent")
      .eq("salon_id", salon_id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (offPeakRules && offPeakRules.length > 0) {
      for (const slot of slots) {
        const slotTime = (slot.starts_at as string).slice(11, 16);
        const match = offPeakRules.find(
          (r) => slotTime >= r.start_time.slice(0, 5) && slotTime < r.end_time.slice(0, 5)
        );
        if (match && slot.services?.price) {
          (slot as any).discounted_price = Math.round(
            slot.services.price * (1 - match.discount_percent / 100)
          );
          (slot as any).off_peak_discount = match.discount_percent;
        }
      }
    }
  }

  return NextResponse.json({ items: slots, total: slots.length });
}
