import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
    const offset = Number(searchParams.get("offset") ?? "0");

    const supabase = await createServerSupabaseClient();

    // Query available slots that belong to salons with last-minute discounts
    const { data, error, count } = await supabase
      .from("availability_slots")
      .select(
        `id, salon_id, service_id, staff_member_id, starts_at, ends_at, status, price_override,
         salon:salons!inner(id, name, slug, cover_photo_url, average_rating, last_minute_discount_percent),
         service:services!inner(id, name_de, name_en, category, duration_minutes, price),
         staff_member:staff_members(id, name, avatar_url)`,
        { count: "exact" }
      )
      .eq("status", "available")
      .gt("starts_at", new Date().toISOString())
      .gt("salons.last_minute_discount_percent", 0)
      .order("starts_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Shape the data to match the LastMinuteSlot type
    const items = (data ?? []).map((slot: any) => {
      const discountPct = slot.salon?.last_minute_discount_percent ?? 0;
      const basePrice = slot.price_override ?? slot.service?.price ?? 0;
      const discountedPrice = Math.round(basePrice * (1 - discountPct / 100));
      return {
        ...slot,
        original_price: basePrice,
        discounted_price: discountedPrice,
      };
    });

    return NextResponse.json({ items, total: count ?? items.length });
  } catch (err) {
    console.error("GET /api/slots/last-minute error:", err);
    return NextResponse.json({ error: "Internal Server Error", items: [], total: 0 }, { status: 500 });
  }
}
